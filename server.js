require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || '/generate_prompt'; // Default to local endpoint
const FAL_KEY = process.env.FAL_KEY;
const FAL_MODEL_URL = process.env.FAL_MODEL_URL || 'https://queue.fal.run/fal-ai/flux-pro/v1.1'; // Using a high quality model default, can be changed to nano-banana-pro if needed

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Настройка EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Статические файлы
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/fonts', express.static(path.join(__dirname, 'fonts')));

// Хранилище для последней картинки (в файле для персистентности)
const DB_FILE = path.join(__dirname, 'latest-image.json');

function saveLatestImage(url) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({ url, timestamp: new Date().toISOString() }));
    } catch (err) {
        console.error('Error saving latest image:', err);
    }
}

function getLatestImage() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading latest image:', err);
    }
    return null;
}

// Загрузка промптов
function getPrompts() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading prompts.json:', err);
        return [];
    }
}

app.get('/', (req, res) => {
    const prompts = getPrompts();
    res.render('index', { 
        prompts: prompts,
        apiUrl: '/generate_prompt' // Point to our own server
    });
});

// Эндпоинт для получения последней картинки (для внешнего сервера)
app.get('/get_current_image', (req, res) => {
    const data = getLatestImage();
    if (data && data.url) {
        res.json({ url: data.url });
    } else {
        res.status(404).json({ error: 'No image generated yet' });
    }
});

// Функция поллинга статуса
async function checkStatus(requestId) {
    const statusUrl = `${FAL_MODEL_URL}/requests/${requestId}/status`;
    while (true) {
        try {
            const response = await axios.get(statusUrl, {
                headers: {
                    'Authorization': `Key ${FAL_KEY}`
                }
            });
            
            const status = response.data.status;
            if (status === 'COMPLETED') {
                return response.data; // Или просто выйти из цикла
            } else if (status === 'FAILED') {
                throw new Error('Generation failed: ' + JSON.stringify(response.data));
            }
            
            // Ждем перед следующим опросом
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            console.error('Error checking status:', error.message);
            throw error;
        }
    }
}

async function getResult(requestId) {
    const resultUrl = `${FAL_MODEL_URL}/requests/${requestId}`;
    const response = await axios.get(resultUrl, {
        headers: {
            'Authorization': `Key ${FAL_KEY}`
        }
    });
    return response.data;
}

app.post('/generate_prompt', async (req, res) => {
    const { user_request } = req.body;
    
    if (!user_request) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!FAL_KEY) {
        console.error('FAL_KEY is missing');
        return res.status(500).json({ error: 'Server configuration error: FAL_KEY missing' });
    }

    try {
        const styleSuffix = " в стиле шедевра масляной живописи, сочетающего русский реализм и эпическое фэнтези. Текстура густых, детальных мазков. Интенсивная комплементарная цветовая палитра (Teal and Red color grading). Гипер-насыщенный контраст: ярко-бирюзовое небо и глубокие сине-зеленые тени против светящейся малиново-красной и розовой листвы. Общий \"розово-зеленый\" колорит. Драматическое объемное освещение: «божественные лучи», пробивающиеся сквозь дымку. Камера расположена низко, на уровне земли (ground level). Взгляд устремлен прямо вперед, создавая глубокую центральную перспективу и уводя взгляд к горизонту.";
        const finalPrompt = user_request + styleSuffix;
        
        console.log('Sending request to Fal.ai:', finalPrompt);
        
        // 1. Отправляем запрос на генерацию
        const response = await axios.post(FAL_MODEL_URL, {
            prompt: finalPrompt,
            // image_size: "landscape_4_3", // For Flux. For others might be aspect_ratio: "4:3"
            aspect_ratio: "16:9", // Uncomment if using a model that supports this param name
            num_images: 1,
            resolution: "2K",
            enable_safety_checker: false
        }, {
            headers: {
                'Authorization': `Key ${FAL_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        const requestId = response.data.request_id;
        console.log('Request ID:', requestId);

        // 2. Ждем завершения
        await checkStatus(requestId);

        // 3. Получаем результат
        const result = await getResult(requestId);
        console.log('Result received');

        // Fal.ai structure usually: { images: [ { url: '...' } ] }
        let imageUrl = '';
        if (result.images && result.images.length > 0) {
            imageUrl = result.images[0].url;
        }

        // Сохраняем ссылку
        if (imageUrl) {
            saveLatestImage(imageUrl);
        }

        res.json({ 
            success: true, 
            data: result,
            imageUrl: imageUrl 
        });

    } catch (error) {
        console.error('Error generating image:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});
