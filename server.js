require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const app = express();

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || '/generate_prompt'; // Default to local endpoint
const FAL_KEY = process.env.FAL_KEY;
const FAL_MODEL_URL = process.env.FAL_MODEL_URL || 'https://queue.fal.run/fal-ai/flux-pro/v1.1'; // Using a high quality model default, can be changed to nano-banana-pro if needed

// Yandex S3 Configuration
const s3Client = new S3Client({
    region: process.env.YANDEX_REGION || 'ru-central1',
    endpoint: process.env.YANDEX_ENDPOINT || 'https://storage.yandexcloud.net',
    credentials: {
        accessKeyId: process.env.YANDEX_ACCESS_KEY_ID,
        secretAccessKey: process.env.YANDEX_SECRET_ACCESS_KEY
    }
});

const YANDEX_BUCKET_NAME = process.env.YANDEX_BUCKET_NAME;
const YANDEX_API_KEY = process.env.YANDEX_API_KEY || '';
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID || '';
const YANDEX_OPENAI_BASE_URL = process.env.YANDEX_OPENAI_BASE_URL || 'https://llm.api.cloud.yandex.net/v1';

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
const MODERATION_PROMPT_FILE = path.join(__dirname, 'moderationPrompt.txt');

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

function getModerationPrompt() {
    try {
        if (fs.existsSync(MODERATION_PROMPT_FILE)) {
            return fs.readFileSync(MODERATION_PROMPT_FILE, 'utf8');
        }
    } catch (err) {
        console.error('Error reading moderationPrompt.txt:', err);
    }
    return 'Ты модератор. Блокируй любой контент про войну, Украину, Россию, насилие, экстремизм, политику, дискриминацию. Разрешай только безопасные запросы. Отвечай JSON: {"allow":true|false,"reason":"..."}';
}

app.get('/', (req, res) => {
    const prompts = getPrompts();
    res.render('index', { 
        prompts: prompts,
        apiUrl: '/generate_prompt', // Point to our own server
        yandexApiKey: YANDEX_API_KEY,
        yandexFolderId: YANDEX_FOLDER_ID,
        yandexOpenaiBaseUrl: YANDEX_OPENAI_BASE_URL,
        moderationPrompt: getModerationPrompt()
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

// Функция загрузки в S3
async function uploadToS3(imageUrl) {
    if (!process.env.YANDEX_ACCESS_KEY_ID || !process.env.YANDEX_BUCKET_NAME) {
        console.warn('Yandex S3 credentials missing. Skipping upload.');
        return imageUrl;
    }

    try {
        // Скачиваем картинку
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });

        const buffer = Buffer.from(response.data, 'binary');
        const fileName = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        const command = new PutObjectCommand({
            Bucket: YANDEX_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: 'image/jpeg'
            // ACL: 'public-read' // Uncomment if bucket is not public by default and you need ACLs
        });

        await s3Client.send(command);

        // Формируем публичную ссылку
        // Базовый URL для Yandex Cloud Object Storage всегда https://storage.yandexcloud.net
        const s3Url = `https://storage.yandexcloud.net/${YANDEX_BUCKET_NAME}/${fileName}`;
        console.log('Image uploaded to S3:', s3Url);
        return s3Url;

    } catch (error) {
        console.error('Error uploading to S3:', error);
        return imageUrl; // Fallback to original URL if upload fails
    }
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
            // Загружаем в Yandex S3
            const s3Url = await uploadToS3(imageUrl);
            
            // Сохраняем персистентную S3 ссылку (или оригинал если не вышло)
            saveLatestImage(s3Url);
            
            // Обновляем imageUrl для ответа фронту, чтобы он тоже использовал S3 ссылку
            imageUrl = s3Url;
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
