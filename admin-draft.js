document.addEventListener('DOMContentLoaded', function() {
    // Определение последовательности драфта в соответствии с алгоритмом:
    // бан сл - бан сп - бан сл - бан сп - пик сл - 2 пика сп - 2 пика сл - пик сп - бан сл - бан сп - пик сл - 2 пика сп - пик сл
    const draftSequence = [
        // Первая фаза банов (4 бана по одному)
        { type: 'ban', team: 'blue', slot: 1, phase: 'БАН СИНЕЙ КОМАНДЫ' },
        { type: 'ban', team: 'red', slot: 1, phase: 'БАН КРАСНОЙ КОМАНДЫ' },
        { type: 'ban', team: 'blue', slot: 2, phase: 'БАН СИНЕЙ КОМАНДЫ' },
        { type: 'ban', team: 'red', slot: 2, phase: 'БАН КРАСНОЙ КОМАНДЫ' },
        
        // Первая фаза пиков (5 пиков)
        { type: 'pick', team: 'blue', slot: 1, phase: 'ВЫБОР СИНЕЙ КОМАНДЫ' },
        { 
            type: 'double-pick', 
            team: 'red', 
            slots: [1, 2], 
            phase: 'ВЫБОР КРАСНОЙ КОМАНДЫ (2 ГЕРОЯ)'
        },
        { 
            type: 'double-pick', 
            team: 'blue', 
            slots: [2, 3], 
            phase: 'ВЫБОР СИНЕЙ КОМАНДЫ (2 ГЕРОЯ)'
        },
        { type: 'pick', team: 'red', slot: 3, phase: 'ВЫБОР КРАСНОЙ КОМАНДЫ' },
        
        // Вторая фаза банов (2 бана)
        { type: 'ban', team: 'blue', slot: 3, phase: 'БАН СИНЕЙ КОМАНДЫ' },
        { type: 'ban', team: 'red', slot: 3, phase: 'БАН КРАСНОЙ КОМАНДЫ' },
        
        // Вторая фаза пиков (4 пика)
        { type: 'pick', team: 'blue', slot: 4, phase: 'ВЫБОР СИНЕЙ КОМАНДЫ' },
        { 
            type: 'double-pick', 
            team: 'red', 
            slots: [4, 5], 
            phase: 'ВЫБОР КРАСНОЙ КОМАНДЫ (2 ГЕРОЯ)'
        },
        { type: 'pick', team: 'blue', slot: 5, phase: 'ВЫБОР СИНЕЙ КОМАНДЫ' }
    ];

    // Элементы управления драфтом
    const startDraftBtn = document.getElementById('start-draft');
    const resetDraftBtn = document.getElementById('reset-draft');
    const nextStepBtn = document.getElementById('next-step');
    const draftPhaseDisplay = document.getElementById('draft-phase-display');
    const draftTimerDisplay = document.getElementById('draft-timer-display');

    // Переменные состояния
    let currentSequenceIndex = 0;
    let timerInterval = null;
    let timerValue = 30;
    let isDraftActive = false;
    let selectedSlots = {
        'ban-blue': [],
        'ban-red': [],
        'pick-blue': [],
        'pick-red': []
    };

    // Элементы ввода для слотов банов и героев
    const banInputs = {
        'blue': [
            document.getElementById('blue-ban-1-name'),
            document.getElementById('blue-ban-2-name'),
            document.getElementById('blue-ban-3-name')
        ],
        'red': [
            document.getElementById('red-ban-1-name'),
            document.getElementById('red-ban-2-name'),
            document.getElementById('red-ban-3-name')
        ]
    };

    const heroInputs = {
        'blue': [
            document.getElementById('blue-hero-1-name'),
            document.getElementById('blue-hero-2-name'),
            document.getElementById('blue-hero-3-name'),
            document.getElementById('blue-hero-4-name'),
            document.getElementById('blue-hero-5-name')
        ],
        'red': [
            document.getElementById('red-hero-1-name'),
            document.getElementById('red-hero-2-name'),
            document.getElementById('red-hero-3-name'),
            document.getElementById('red-hero-4-name'),
            document.getElementById('red-hero-5-name')
        ]
    };

    // Доступ к элементам превью
    const previewBanSlots = {
        'blue': [
            document.getElementById('preview-blue-ban-1'),
            document.getElementById('preview-blue-ban-2'),
            document.getElementById('preview-blue-ban-3')
        ],
        'red': [
            document.getElementById('preview-red-ban-1'),
            document.getElementById('preview-red-ban-2'),
            document.getElementById('preview-red-ban-3')
        ]
    };

    const previewHeroSlots = {
        'blue': [
            document.getElementById('preview-blue-hero-1'),
            document.getElementById('preview-blue-hero-2'),
            document.getElementById('preview-blue-hero-3'),
            document.getElementById('preview-blue-hero-4'),
            document.getElementById('preview-blue-hero-5')
        ],
        'red': [
            document.getElementById('preview-red-hero-1'),
            document.getElementById('preview-red-hero-2'),
            document.getElementById('preview-red-hero-3'),
            document.getElementById('preview-red-hero-4'),
            document.getElementById('preview-red-hero-5')
        ]
    };

    // Кнопки применения настроек
    const applyBansBtn = document.getElementById('apply-bans');
    const applyHeroesBtn = document.getElementById('apply-heroes');

    // Функция запуска драфта
    function startDraft() {
        if (!isDraftActive) {
            // Запуск нового драфта
            isDraftActive = true;
            currentSequenceIndex = 0;
            selectedSlots = {
                'ban-blue': [],
                'ban-red': [],
                'pick-blue': [],
                'pick-red': []
            };
            
            // Обновляем интерфейс
            startDraftBtn.textContent = 'Пауза драфта';
            nextStepBtn.disabled = false;
            
            // Запускаем первый шаг
            startDraftStep();
            
            // Синхронизация с viewer.html через localStorage
            updateDraftStateForViewer();
        } else {
            // Постановка на паузу
            pauseDraft();
        }
    }

    // Постановка драфта на паузу
    function pauseDraft() {
        isDraftActive = false;
        clearInterval(timerInterval);
        startDraftBtn.textContent = 'Продолжить драфт';
        
        // Обновление статуса в localStorage для viewer.html
        const draftState = JSON.parse(localStorage.getItem('mlbbDraftState') || '{}');
        draftState.isPaused = true;
        localStorage.setItem('mlbbDraftState', JSON.stringify(draftState));
    }

    // Сброс драфта
    function resetDraft() {
        // Сброс всех переменных состояния
        isDraftActive = false;
        currentSequenceIndex = 0;
        timerValue = 30;
        clearInterval(timerInterval);
        
        // Сброс интерфейса
        startDraftBtn.textContent = 'Запустить драфт';
        draftPhaseDisplay.textContent = 'СТАТУС: ОЖИДАНИЕ';
        draftPhaseDisplay.className = 'draft-phase-display';
        draftTimerDisplay.textContent = '30';
        draftTimerDisplay.className = 'draft-timer-display';
        nextStepBtn.disabled = false;
        
        // Сброс выделения активных слотов
        resetActiveSlots();
        
        // Сброс состояния в localStorage для viewer.html
        localStorage.setItem('mlbbDraftState', JSON.stringify({
            isActive: false,
            isPaused: false,
            currentStep: 0,
            timer: 30
        }));
    }

    // Сброс выделения активных слотов
    function resetActiveSlots() {
        // Удаляем классы активности со всех полей ввода
        document.querySelectorAll('.hero-input').forEach(input => {
            input.classList.remove('active-input', 'active-input-red', 'completed');
        });
        
        // Удаляем классы активности со всех слотов предпросмотра
        document.querySelectorAll('.preview .ban-slot, .preview .hero-slot').forEach(slot => {
            slot.classList.remove('active-slot');
        });
    }

    // Запуск текущего шага драфта
    function startDraftStep() {
        if (currentSequenceIndex >= draftSequence.length) {
            // Драфт завершен
            completeDraft();
            return;
        }
        
        // Получаем текущий шаг
        const currentStep = draftSequence[currentSequenceIndex];
        
        // Обновляем отображение фазы
        updatePhaseDisplay(currentStep);
        
        // Выделяем активные слоты
        highlightActiveSlots(currentStep);
        
        // Запускаем таймер
        startTimer();
        
        // Обновляем состояние для viewer.html
        updateDraftStateForViewer();
    }

    // Обновление отображения текущей фазы
    function updatePhaseDisplay(step) {
        draftPhaseDisplay.textContent = step.phase;
        draftPhaseDisplay.className = 'draft-phase-display';
        
        if (step.team === 'blue') {
            draftPhaseDisplay.classList.add('draft-phase-blue');
        } else {
            draftPhaseDisplay.classList.add('draft-phase-red');
        }
    }

    // Выделение активных слотов
    function highlightActiveSlots(step) {
        // Сначала сбрасываем все активные слоты
        resetActiveSlots();
        
        if (step.type === 'ban') {
            // Выделяем соответствующий слот бана
            const inputContainer = banInputs[step.team][step.slot - 1].parentElement;
            if (step.team === 'blue') {
                inputContainer.classList.add('active-input');
            } else {
                inputContainer.classList.add('active-input-red');
            }
            
            // Выделяем соответствующий слот в предпросмотре
            const previewSlot = previewBanSlots[step.team][step.slot - 1];
            previewSlot.classList.add('active-slot');
        } 
        else if (step.type === 'pick') {
            // Выделяем соответствующий слот выбора героя
            const inputContainer = heroInputs[step.team][step.slot - 1].parentElement;
            if (step.team === 'blue') {
                inputContainer.classList.add('active-input');
            } else {
                inputContainer.classList.add('active-input-red');
            }
            
            // Выделяем соответствующий слот в предпросмотре
            const previewSlot = previewHeroSlots[step.team][step.slot - 1];
            previewSlot.classList.add('active-slot');
        }
        else if (step.type === 'double-pick') {
            // Выделяем оба слота для двойного выбора
            step.slots.forEach(slotNum => {
                const inputContainer = heroInputs[step.team][slotNum - 1].parentElement;
                if (step.team === 'blue') {
                    inputContainer.classList.add('active-input');
                } else {
                    inputContainer.classList.add('active-input-red');
                }
                
                // Выделяем соответствующие слоты в предпросмотре
                const previewSlot = previewHeroSlots[step.team][slotNum - 1];
                previewSlot.classList.add('active-slot');
            });
            
            // Добавляем визуальное группирование для двойного пика
            // (Это должно быть реализовано дополнительно с использованием CSS)
        }
    }

    // Запуск таймера для текущего шага
    function startTimer() {
        // Сбрасываем предыдущий таймер
        clearInterval(timerInterval);
        
        // Начальное значение таймера
        timerValue = 30;
        updateTimerDisplay();
        
        // Запускаем обратный отсчет
        timerInterval = setInterval(() => {
            timerValue--;
            updateTimerDisplay();
            
            // Обновляем состояние для viewer.html
            updateDraftStateForViewer();
            
            if (timerValue <= 0) {
                // Время вышло, переходим к следующему шагу
                clearInterval(timerInterval);
                moveToNextStep();
            }
        }, 1000);
    }

    // Обновление отображения таймера
    function updateTimerDisplay() {
        draftTimerDisplay.textContent = timerValue;
        draftTimerDisplay.className = 'draft-timer-display';
        
        if (timerValue <= 5) {
            draftTimerDisplay.classList.add('draft-timer-critical');
        } else if (timerValue <= 10) {
            draftTimerDisplay.classList.add('draft-timer-warning');
        }
    }

    // Переход к следующему шагу драфта
    function moveToNextStep() {
        // Отмечаем текущий шаг как завершенный
        markCurrentStepCompleted();
        
        // Увеличиваем индекс текущего шага
        currentSequenceIndex++;
        
        // Если это не последний шаг, запускаем следующий
        if (currentSequenceIndex < draftSequence.length) {
            startDraftStep();
        } else {
            // Драфт завершен
            completeDraft();
        }
    }

    // Отметка текущего шага как завершенного
    function markCurrentStepCompleted() {
        if (currentSequenceIndex >= draftSequence.length) return;
        
        const currentStep = draftSequence[currentSequenceIndex];
        
        // Для обычных шагов
        if (currentStep.type === 'ban' || currentStep.type === 'pick') {
            const inputContainer = currentStep.type === 'ban' 
                ? banInputs[currentStep.team][currentStep.slot - 1].parentElement
                : heroInputs[currentStep.team][currentStep.slot - 1].parentElement;
            
            inputContainer.classList.remove('active-input', 'active-input-red');
            inputContainer.classList.add('completed');
            
            // Применяем соответствующие изменения
            if (currentStep.type === 'ban') {
                applyBan(currentStep.team, currentStep.slot);
            } else {
                applyHero(currentStep.team, currentStep.slot);
            }
        }
        // Для двойных пиков
        else if (currentStep.type === 'double-pick') {
            currentStep.slots.forEach(slotNum => {
                const inputContainer = heroInputs[currentStep.team][slotNum - 1].parentElement;
                inputContainer.classList.remove('active-input', 'active-input-red');
                inputContainer.classList.add('completed');
                
                // Применяем изменения для героя
                applyHero(currentStep.team, slotNum);
            });
        }
    }

    // Автоматически применяем бан
    function applyBan(team, slotNum) {
        const banInput = banInputs[team][slotNum - 1];
        if (banInput.value.trim() === '') {
            // Если поле пустое, можно выбрать случайного героя или оставить пустым
            return;
        }
        
        // Обновляем в превью и сохраняем в localStorage, используя логику из admin.js
        const banSlotId = `preview-${team}-ban-${slotNum}`;
        updateBanPreview(banSlotId, banInput.value);
        
        // Сохраняем состояние
        saveState();
    }

    // Автоматически применяем выбор героя
    function applyHero(team, slotNum) {
        const heroInput = heroInputs[team][slotNum - 1];
        if (heroInput.value.trim() === '') {
            // Если поле пустое, можно выбрать случайного героя или оставить пустым
            return;
        }
        
        // Обновляем в превью и сохраняем в localStorage, используя логику из admin.js
        const heroSlotId = `preview-${team}-hero-${slotNum}`;
        const heroesFolder = document.getElementById('heroes-folder').value || 'heroes';
        const imageExtension = document.getElementById('image-extension').value || '.png';
        
        updateHeroPreview(heroSlotId, heroInput.value, heroesFolder, imageExtension);
        
        // Сохраняем состояние
        saveState();
    }

    // Завершение драфта
    function completeDraft() {
        isDraftActive = false;
        clearInterval(timerInterval);
        
        // Обновляем интерфейс
        draftPhaseDisplay.textContent = 'ДРАФТ ЗАВЕРШЕН';
        draftPhaseDisplay.className = 'draft-phase-display';
        startDraftBtn.textContent = 'Запустить драфт';
        draftTimerDisplay.textContent = '0';
        nextStepBtn.disabled = true;
        
        // Обновляем состояние для viewer.html
        localStorage.setItem('mlbbDraftState', JSON.stringify({
            isActive: false,
            isPaused: false,
            currentStep: draftSequence.length,
            phase: 'ДРАФТ ЗАВЕРШЕН',
            timer: 0,
            isCompleted: true
        }));
        
        // Показываем уведомление пользователю
        showNotification('Драфт успешно завершен');
    }

    // Обновление состояния драфта для viewer.html
    function updateDraftStateForViewer() {
        if (currentSequenceIndex >= draftSequence.length) return;
        
        const currentStep = draftSequence[currentSequenceIndex];
        const draftState = {
            isActive: isDraftActive,
            isPaused: !isDraftActive,
            currentStep: currentSequenceIndex,
            currentSequence: currentStep,
            phase: currentStep.phase,
            timer: timerValue,
            isCompleted: false
        };
        
        localStorage.setItem('mlbbDraftState', JSON.stringify(draftState));
    }

    // Функция для отображения уведомления (из admin.js)
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.backgroundColor = '#4cc9f0';
        notification.style.color = 'white';
        notification.style.boxShadow = '0 3px 6px rgba(0,0,0,0.2)';
        notification.style.zIndex = '1000';
        
        document.body.appendChild(notification);
        
        // Удаляем уведомление через 3 секунды
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    // Функции для обновления превью из админ.js
    function updateBanPreview(banId, heroName, customImgUrl = null) {
        const banSlot = document.getElementById(banId);
        if (!banSlot) return;
        
        const imgElement = banSlot.querySelector('.ban-img');
        
        if (heroName && heroName.trim() !== '') {
            // Если предоставлен пользовательский URL изображения, используем его
            if (customImgUrl && !customImgUrl.includes('placeholder')) {
                imgElement.src = customImgUrl;
            } else {
                // Формируем URL изображения
                const heroesFolder = document.getElementById('heroes-folder').value || 'heroes';
                const imageExtension = document.getElementById('image-extension').value || '.png';
                const heroImgUrl = getHeroImageUrl(heroName, heroesFolder, imageExtension);
                
                // Сохраняем текущий URL изображения перед его изменением
                const originalSrc = imgElement.src;
                imgElement.src = heroImgUrl;
                
                // Обработка ошибки загрузки изображения
                imgElement.onerror = function() {
                    console.warn(`Не удалось загрузить изображение для бана ${heroName}: ${heroImgUrl}`);
                    // Если изображение было уже не placeholder, сохраняем его и не сбрасываем на placeholder
                    if (originalSrc && !originalSrc.includes('placeholder')) {
                        console.log(`Сохраняем предыдущее изображение: ${originalSrc}`);
                        this.src = originalSrc;
                    } else {
                        this.src = '/api/placeholder/120/120';
                    }
                };
            }
        } else {
            // Устанавливаем заполнитель, если имя героя не указано
            imgElement.src = '/api/placeholder/120/120';
        }
    }

    function updateHeroPreview(previewId, heroName, folder, extension) {
        const heroSlot = document.getElementById(previewId);
        if (!heroSlot) return;
        
        const heroNameElement = heroSlot.querySelector('.hero-name');
        const imgElement = heroSlot.querySelector('.hero-img');
        
        if (heroName && heroName.trim() !== '') {
            heroNameElement.textContent = heroName;
            
            // Формируем URL изображения
            const heroImgUrl = getHeroImageUrl(heroName, folder, extension);
            
            // Сохраняем текущий URL изображения перед его изменением
            const originalSrc = imgElement.src;
            imgElement.src = heroImgUrl;
            
            // Обработка ошибки загрузки изображения
            imgElement.onerror = function() {
                console.warn(`Не удалось загрузить изображение для ${heroName}: ${heroImgUrl}`);
                // Если изображение было уже не placeholder, сохраняем его и не сбрасываем на placeholder
                if (originalSrc && !originalSrc.includes('placeholder')) {
                    console.log(`Сохраняем предыдущее изображение: ${originalSrc}`);
                    this.src = originalSrc;
                } else {
                    this.src = '/api/placeholder/120/120';
                }
            };
        } else {
            // Устанавливаем заполнитель, если имя героя не указано
            const heroNumber = previewId.split('-')[3];
            heroNameElement.textContent = `Герой ${heroNumber}`;
            imgElement.src = '/api/placeholder/120/120';
        }
    }

    function getHeroImageUrl(heroName, folder, extension) {
        if (!heroName || heroName.trim() === '') {
            return '/api/placeholder/120/120';
        }
        
        // Обработка имени героя (замена пробелов, дефисов и т.д. на подчеркивания)
        const processedName = heroName.toLowerCase().replace(/[\s'-]+/g, '_');
        
        // Используем путь, который будет работать в вашей среде
        return `${folder}/${processedName}${extension}`;
    }

    function saveState() {
        // Функция из admin.js для сохранения состояния в localStorage
        // Предполагается, что она уже реализована в admin.js
        if (typeof window.saveState === 'function') {
            window.saveState();
        }
    }

    // Инициализация обработчиков событий
    function initEventListeners() {
        // Обработчики для кнопок управления драфтом
        startDraftBtn.addEventListener('click', startDraft);
        resetDraftBtn.addEventListener('click', resetDraft);
        nextStepBtn.addEventListener('click', function() {
            if (isDraftActive) {
                clearInterval(timerInterval);
                moveToNextStep();
            }
        });
        
        // Обработчики для входных полей, чтобы автоматически переходить к следующему шагу
        // после выбора героя или бана
        document.querySelectorAll('.hero-input input, .hero-input input').forEach(input => {
            input.addEventListener('change', function() {
                // Проверяем, является ли поле активным в текущем шаге
                const isActiveInput = this.parentElement.classList.contains('active-input') || 
                                    this.parentElement.classList.contains('active-input-red');
                
                if (isDraftActive && isActiveInput && this.value.trim() !== '') {
                    // Автоматически переходим к следующему шагу с небольшой задержкой
                    setTimeout(() => {
                        clearInterval(timerInterval);
                        moveToNextStep();
                    }, 500);
                }
            });
        });
        
        // Интеграция с существующей системой, когда пользователь применяет баны или выбор героев
        applyBansBtn.addEventListener('click', function() {
            if (isDraftActive) {
                const currentStep = draftSequence[currentSequenceIndex];
                if (currentStep.type === 'ban') {
                    // После применения банов автоматически переходим к следующему шагу
                    setTimeout(() => {
                        clearInterval(timerInterval);
                        moveToNextStep();
                    }, 500);
                }
            }
        });
        
        applyHeroesBtn.addEventListener('click', function() {
            if (isDraftActive) {
                const currentStep = draftSequence[currentSequenceIndex];
                if (currentStep.type === 'pick' || currentStep.type === 'double-pick') {
                    // После применения выбора героев автоматически переходим к следующему шагу
                    setTimeout(() => {
                        clearInterval(timerInterval);
                        moveToNextStep();
                    }, 500);
                }
            }
        });
        
        // Клавиатурные сокращения
        document.addEventListener('keydown', function(e) {
            // Пробел для запуска/паузы драфта
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                if (!isDraftActive) {
                    startDraft();
                } else {
                    pauseDraft();
                }
            }
            
            // N для перехода к следующему шагу
            if ((e.key === 'n' || e.key === 'N') && e.target.tagName !== 'INPUT' && isDraftActive) {
                e.preventDefault();
                clearInterval(timerInterval);
                moveToNextStep();
            }
            
            // R для сброса драфта
            if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT' && e.ctrlKey) {
                e.preventDefault();
                resetDraft();
            }
        });
    }

    // Инициализация при загрузке
    function init() {
        // Проверяем наличие необходимых элементов
        if (!startDraftBtn || !resetDraftBtn || !nextStepBtn || !draftPhaseDisplay || !draftTimerDisplay) {
            console.error('Элементы управления драфтом не найдены');
            return;
        }
        
        // Инициализация обработчиков событий
        initEventListeners();
        
        // Сброс состояния драфта при загрузке
        resetDraft();
        
        console.log('Система управления драфтом инициализирована');
    }
    
    // Запуск инициализации
    init();
});