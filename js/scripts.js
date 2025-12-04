document.addEventListener("DOMContentLoaded", function () {
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
            let content = item.innerText;
            mainInput.value = content;
            commentResize(mainInput);
            checkValue(mainInput);
            
            // Сразу запускаем генерацию
            if (!btnStepNext[0].disabled) {
                btnStepNext[0].click();
            }
        });
    });

    // шаги
    const steps = document.querySelectorAll(".step");
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
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const formData = {
            user_request: document.getElementById('user_request').value
        };

        console.log(formData);

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