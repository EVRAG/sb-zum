document.addEventListener("DOMContentLoaded", function () {
    const config = window.appConfig || {};
    const yandexApiKey = config.yandexApiKey || '';
    const yandexFolderId = config.yandexFolderId || '';
    const yandexOpenaiBaseUrl = config.yandexOpenaiBaseUrl || 'https://llm.api.cloud.yandex.net/v1';
    const moderationPrompt = config.moderationPrompt || 'Ты модератор. Блокируй любой опасный или запрещенный контент. Отвечай JSON {"allow":true|false,"reason":"..."}';

    // перемешивание подсказок в начале
    const suggestionsWrap = document.querySelector(".form-helper-wrap");
    const suggestions = document.querySelectorAll(".form-helper-btn");

    function shuffle() {
        const shuffledSuggestions = Array.from(suggestions);
        shuffledSuggestions.sort(() => Math.random() - 0.5);
        suggestionsWrap.innerHTML = '';
        shuffledSuggestions.forEach(item => suggestionsWrap.appendChild(item));
    }
    shuffle();

    // кнопка перехода на следующий шаг
    btnStepNext = document.querySelectorAll(".btn-step-next");

    // поле ввода
    const mainInput = document.querySelector(".form-input")

    // увеличение инпута в зависимости от текста
    function commentResize(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }
    function checkValue(textarea) {
        if (textarea.value.length >= 2) {
            return (btnStepNext[0].disabled = false);
        } else {
            return (btnStepNext[0].disabled = true);
        }
    }

    mainInput.addEventListener('input', function () {
        commentResize(this);
        checkValue(this);
    });

    // кнопки для инпута
    suggestions.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            
            // 1. Вставляем текст (добавляем к текущему)
            let content = item.innerText;
            // Добавляем пробел, если поле не пустое и не заканчивается пробелом
            if (mainInput.value && !mainInput.value.endsWith(' ')) {
                mainInput.value += " ";
            }
            mainInput.value += content;
            
            commentResize(mainInput);
            checkValue(mainInput);
            
            // 2. Обновляем (перемешиваем) список подсказок
            shuffle();
        });
    });

    // шаги
    const steps = document.querySelectorAll(".step");
    function resetToFirstStep() {
        steps.forEach(element => element.classList.remove('is-active'));
        steps[0].classList.add('is-active');
        document.body.classList.remove("bg-load");
    }

    function handleStep() {
        const currentStep = document.querySelector('.step.is-active');
        const nextStep = currentStep.nextElementSibling;

        if (nextStep) {
            currentStep.classList.remove('is-active');
            nextStep.classList.add('is-active');

            const loader = nextStep.querySelector('.generate-loader');

            if (loader) {
                // проценты
                document.body.classList.add("bg-load");
                const percentage = document.querySelector('.generate-percent span');
                let currentNumber = 0;
                const duration = 25000; // 25 секунд
                const increment = 100 / (duration / 100); // 100ms interval

                // Очищаем предыдущий интервал если был
                if (window.progressInterval) clearInterval(window.progressInterval);

                window.progressInterval = setInterval(() => {
                    currentNumber += increment;
                    if (currentNumber >= 99) {
                        currentNumber = 99;
                        // Ждем ответа сервера, не ставим 100% сразу
                        // clearInterval(window.progressInterval);
                    }
                    percentage.textContent = Math.floor(currentNumber);
                }, 100);
                
                // Убираем автоматический переход, ждем ответа сервера
                // setTimeout(() => { ... }, 25000); 
            } else if ((Array.from(steps).indexOf(nextStep) === 1) || (Array.from(steps).indexOf(nextStep) === 2)) {
                document.body.classList.add("bg-load");
            } else {
                document.body.classList.remove("bg-load");
            }
        }
    }

    btnStepNext.forEach(button => {
        button.addEventListener('click', function (e) {
            handleStep();
        });
    });

    document.querySelectorAll('.btn-step-first').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            location.reload();
            // steps.forEach(element => {
            //     element.classList.remove('is-active')
            // });
            // steps[0].classList.add('is-active')
        })
    })

    // отправка данных в форме
    const form = document.querySelector('.form');

    async function moderatePrompt(text) {
        if (!yandexApiKey || !yandexFolderId) {
            alert('Модерация недоступна: отсутствуют ключи Yandex GPT.');
            resetToFirstStep();
            return false;
        }

        const model = `gpt://${yandexFolderId}/yandexgpt/latest`;
        try {
            const response = await fetch(`${yandexOpenaiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Api-Key ${yandexApiKey}`,
                    'x-folder-id': yandexFolderId
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: moderationPrompt },
                        { role: 'user', content: text }
                    ],
                    max_tokens: 100,
                    temperature: 0,
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                throw new Error(`Moderation request failed: ${response.status}`);
            }

            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content || '{}';
            let parsed;
            try {
                parsed = JSON.parse(content);
            } catch (e) {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    parsed = JSON.parse(match[0]);
                } else {
                    throw new Error('Invalid JSON from moderation model');
                }
            }

            const allow = parsed.allow === true;
            if (!allow) {
                const reason = parsed.reason || 'Промпт отклонен модерацией';
                alert(reason);
                resetToFirstStep();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Moderation error:', error);
            alert('Ошибка модерации. Попробуйте еще раз.');
            resetToFirstStep();
            return false;
        }
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const formData = {
            user_request: document.getElementById('user_request').value
        };

        console.log(formData);

        const isAllowed = await moderatePrompt(formData.user_request);
        if (!isAllowed) {
            return;
        }

        fetch(form.action, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Success:', data);
                
                if (data.imageUrl) {
                    // Обновляем картинки
                    const resultImages = document.querySelectorAll('.result-item img');
                    resultImages.forEach(img => {
                        img.src = data.imageUrl;
                    });

                    // Завершаем прогресс бар
                    const percentage = document.querySelector('.generate-percent span');
                    if (percentage) percentage.textContent = "100";
                    if (window.progressInterval) clearInterval(window.progressInterval);

                    // Переходим к следующему шагу (Result)
                    const currentStep = document.querySelector('.step.is-active'); // Это должен быть loading step
                    const nextStep = currentStep.nextElementSibling; // Result step
                    
                    if (nextStep) {
                        // Небольшая задержка чтобы пользователь увидел 100%
                        setTimeout(() => {
                            currentStep.classList.remove('is-active');
                            nextStep.classList.add('is-active');
                            document.body.classList.remove("bg-load"); // Убираем фон загрузки если нужно
                        }, 500);
                    }
                }
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Ошибка генерации. Попробуйте еще раз.');
                location.reload();
            });
    });
})