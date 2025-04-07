// Код для анимации процесса драфта и таймера в режиме зрителя
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
        { type: 'ban', team: 'red', slot: 3, phase: 'БАН КРАСНОЙ КОМАНДЫ' },
        { type: 'ban', team: 'blue', slot: 3, phase: 'БАН СИНЕЙ КОМАНДЫ' },
        
        
        // Вторая фаза пиков (4 пика)
        { type: 'pick', team: 'red', slot: 4, phase: 'ВЫБОР КРАСНОЙ КОМАНДЫ' },
        { 
            type: 'double-pick', 
            team: 'blue', 
            slots: [4, 5], 
            phase: 'ВЫБОР КРАСНОЙ КОМАНДЫ (2 ГЕРОЯ)'
        },
        { type: 'pick', team: 'red', slot: 5, phase: 'ВЫБОР СИНЕЙ КОМАНДЫ' }
    ];

    // Хранение состояния
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
    let previouslySelectedSlot = null;
    
    // Флаг для определения, создан ли уже UI
    let isDraftUICreated = false;
    
    // Элементы UI
    let timerContainer = null;
    let phaseIndicator = null;
    let draftControls = null;
    let startButton = null;
    let resetButton = null;

    // Создание DOM элементов для таймера и индикатора фазы
    function createDraftUI() {
        if (isDraftUICreated) return;
        
        // Создаем элемент таймера
        timerContainer = document.createElement('div');
        timerContainer.className = 'timer-container';
        timerContainer.innerHTML = `
            <div class="timer-progress">
                <div class="timer-bar"></div>
            </div>
            <div class="timer-time">30</div>
        `;
        document.body.appendChild(timerContainer);

        // Создаем индикатор текущей фазы драфта
        phaseIndicator = document.createElement('div');
        phaseIndicator.className = 'draft-phase-indicator';
        phaseIndicator.textContent = 'СТАРТ ДРАФТА';
        document.body.appendChild(phaseIndicator);


        // Добавляем возможность выбора героя кликом (в зрительском режиме)
        if (window.location.pathname.includes('viewer.html')) {
            addClickHandlers();
        }

        // Устанавливаем флаг, что UI создан
        isDraftUICreated = true;
    }

    // Функция для мониторинга состояния драфта из админ-панели
    function checkDraftStateFromAdmin() {
        const draftState = localStorage.getItem('mlbbDraftState');
        if (!draftState) return;
        
        try {
            const state = JSON.parse(draftState);
            
            // Если состояние изменилось, обновляем UI
            if (state.isActive !== isDraftActive || state.currentStep !== currentSequenceIndex) {
                // Если драфт активен в админке
                if (state.isActive) {
                    // Если UI еще не создан, создаем его
                    if (!isDraftUICreated) {
                        createDraftUI();
                    }
                    
                    // Обновляем состояние
                    isDraftActive = true;
                    currentSequenceIndex = state.currentStep;
                    timerValue = state.timer || 30;
                    
                    // Обновляем UI
                    updatePhaseIndicator();
                    updateTimerUI();
                    highlightActiveSlot();
                    
                    // Обновляем кнопки
                    if (startButton) {
                        startButton.textContent = 'Пауза';
                    }
                } 
                // Если драфт на паузе в админке
                else if (state.isPaused) {
                    // Приостанавливаем драфт
                    pauseDraft();
                }
                // Если драфт завершен в админке
                else if (state.isCompleted) {
                    // Завершаем драфт
                    isDraftActive = false;
                    currentSequenceIndex = draftSequence.length;
                    
                    // Обновляем UI
                    if (phaseIndicator) {
                        phaseIndicator.textContent = 'ДРАФТ ЗАВЕРШЕН';
                        phaseIndicator.className = 'draft-phase-indicator';
                    }
                    
                    if (startButton) {
                        startButton.textContent = 'Запустить драфт';
                    }
                    
                    // Очищаем все выделения
                    resetActiveSlots();
                    
                    // Добавляем класс завершения драфта для красивой анимации
                    document.querySelector('.overlay-container').classList.add('draft-complete');
                }
            }
            
            // Синхронизируем таймер
            if (state.timer && isDraftActive) {
                timerValue = state.timer;
                updateTimerUI();
            }
        } catch (error) {
            console.error('Ошибка при проверке состояния драфта из админ-панели:', error);
        }
    }

    // Запуск драфта
    function startDraft() {
        isDraftActive = true;
        
        // Удаляем класс завершения драфта, если он был
        document.querySelector('.overlay-container').classList.remove('draft-complete');
        
        // Проверяем, начинаем ли с начала или продолжаем
        if (currentSequenceIndex === 0) {
            // Сброс UI для начала нового драфта
            resetDraftUI();
        }
        
        // Запускаем таймер
        startTimer();
        
        // Выделяем активный слот
        highlightActiveSlot();
        
        // Обновляем индикатор фазы
        updatePhaseIndicator();
        
        // Обновляем сохраненное состояние для админ-панели
        updateDraftStateForAdmin();
    }

    // Постановка драфта на паузу
    function pauseDraft() {
        isDraftActive = false;
        clearInterval(timerInterval);
        
        if (startButton) {
            startButton.textContent = 'Продолжить';
        }
        
        // Обновляем сохраненное состояние для админ-панели
        updateDraftStateForAdmin();
    }

    // Сброс драфта
    function resetDraft() {
        // Останавливаем таймер
        clearInterval(timerInterval);
        
        // Сбрасываем все переменные
        currentSequenceIndex = 0;
        timerValue = 30;
        isDraftActive = false;
        selectedSlots = {
            'ban-blue': [],
            'ban-red': [],
            'pick-blue': [],
            'pick-red': []
        };
        previouslySelectedSlot = null;
        
        // Сбрасываем UI
        resetDraftUI();
        
        // Обновляем текст кнопки
        if (startButton) {
            startButton.textContent = 'Запустить драфт';
        }
        
        // Обновляем отображение таймера
        updateTimerUI();
        
        // Обновляем индикатор фазы
        if (phaseIndicator) {
            phaseIndicator.textContent = 'СТАРТ ДРАФТА';
            phaseIndicator.className = 'draft-phase-indicator';
        }
        
        // Удаляем класс завершения драфта
        document.querySelector('.overlay-container').classList.remove('draft-complete');
        
        // Обновляем сохраненное состояние для админ-панели
        updateDraftStateForAdmin();
    }

    // Сброс UI для драфта
    function resetDraftUI() {
        // Удаляем выделение со всех слотов
        resetActiveSlots();
        
        // Удаляем классы выбранных героев/банов
        document.querySelectorAll('.hero-selected, .ban-selected, .hero-appear, .last-pick').forEach(slot => {
            slot.classList.remove('hero-selected', 'ban-selected', 'hero-appear', 'last-pick');
        });
    }

    // Обновление индикатора фазы
    function updatePhaseIndicator() {
        if (!phaseIndicator || currentSequenceIndex >= draftSequence.length) return;
        
        const currentStep = draftSequence[currentSequenceIndex];
        phaseIndicator.textContent = currentStep.phase;
        
        // Обновляем класс для подсветки соответствующей команды
        phaseIndicator.className = 'draft-phase-indicator';
        if (currentStep.team === 'blue') {
            phaseIndicator.classList.add('blue-phase');
        } else {
            phaseIndicator.classList.add('red-phase');
        }
    }

    // Запуск таймера
    function startTimer() {
        // Сбрасываем таймер, если он уже запущен
        if (timerInterval) {
            clearInterval(timerInterval);
        }
        
        // Устанавливаем начальное значение
        timerValue = 30;
        updateTimerUI();
        
        // Запускаем обратный отсчет
        timerInterval = setInterval(function() {
            timerValue--;
            updateTimerUI();
            
            // Обновляем состояние для админ-панели
            updateDraftStateForAdmin();
            
            if (timerValue <= 0) {
                // Время вышло, переходим к следующему шагу
                clearInterval(timerInterval);
                moveToNextStep();
            }
        }, 1000);
    }

    // Обновление UI таймера
    function updateTimerUI() {
        if (!timerContainer) return;
        
        const timerTimeElement = timerContainer.querySelector('.timer-time');
        const timerBarElement = timerContainer.querySelector('.timer-bar');
        
        if (timerTimeElement && timerBarElement) {
            // Обновляем текстовое отображение таймера
            timerTimeElement.textContent = timerValue;
            
            // Обновляем прогресс-бар
            const progressPercentage = (timerValue / 30) * 100;
            timerBarElement.style.width = `${progressPercentage}%`;
            
            // Меняем цвет в зависимости от времени
            if (timerValue <= 5) {
                timerBarElement.style.background = 'linear-gradient(90deg, #ff0000, #ff6b6b)';
            } else if (timerValue <= 10) {
                timerBarElement.style.background = 'linear-gradient(90deg, #ffa500, #ffd700)';
            } else {
                timerBarElement.style.background = 'linear-gradient(90deg, #4cc9f0, #f72585)';
            }
        }
    }

    // Выделение активного слота
    function highlightActiveSlot() {
        // Удаляем предыдущее выделение
        resetActiveSlots();
        
        // Если драфт не активен или все шаги завершены, выходим
        if (!isDraftActive || currentSequenceIndex >= draftSequence.length) {
            return;
        }
        
        // Получаем информацию о текущем шаге
        const currentStep = draftSequence[currentSequenceIndex];
        
        // Обработка в зависимости от типа шага
        if (currentStep.type === 'ban') {
            // Находим соответствующий слот бана
            const slotId = `${currentStep.team}-ban-${currentStep.slot}`;
            
            // Добавляем класс активного слота
            const slotElement = document.getElementById(slotId);
            if (slotElement) {
                slotElement.classList.add('active-slot');
            }
        } 
        else if (currentStep.type === 'pick') {
            // Находим соответствующий слот героя
            const slotId = `${currentStep.team}-hero-${currentStep.slot}`;
            
            // Добавляем класс активного слота
            const slotElement = document.getElementById(slotId);
            if (slotElement) {
                slotElement.classList.add('active-slot');
            }
        }
        else if (currentStep.type === 'double-pick') {
            // Обрабатываем оба слота для двойного выбора
            currentStep.slots.forEach(slotNum => {
                const slotId = `${currentStep.team}-hero-${slotNum}`;
                const slotElement = document.getElementById(slotId);
                if (slotElement) {
                    slotElement.classList.add('active-slot');
                }
            });
        }
    }

    // Сброс выделения активных слотов
    function resetActiveSlots() {
        document.querySelectorAll('.active-slot').forEach(slot => {
            slot.classList.remove('active-slot');
        });
    }

    // Добавление обработчиков кликов на слоты
    function addClickHandlers() {
        // Для банов
        document.querySelectorAll('.ban-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                if (isDraftActive && slot.classList.contains('active-slot')) {
                    // Обрабатываем клик по активному слоту бана
                    const currentStep = draftSequence[currentSequenceIndex];
                    if (currentStep.type === 'ban') {
                        // Имитируем выбор случайного героя из списка
                        const heroes = ["Alucard", "Layla", "Miya", "Tigreal", "Eudora", "Saber", "Balmond", "Nana", "Zilong", "Franco"];
                        const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
                        
                        // Обновляем внешний вид слота
                        const imgElement = slot.querySelector('.ban-img');
                        const heroesFolder = 'heroes';
                        const imageExtension = '.png';
                        imgElement.src = `${heroesFolder}/${randomHero.toLowerCase()}${imageExtension}`;
                        
                        // Добавляем анимацию выбора
                        slot.classList.remove('active-slot');
                        slot.classList.add('ban-selected');
                        
                        // Сохраняем информацию о выбранном слоте
                        const team = currentStep.team;
                        const slotNumber = currentStep.slot;
                        selectedSlots[`ban-${team}`].push(slotNumber);
                        
                        // Сохраняем слот как предыдущий выбранный
                        if (previouslySelectedSlot) {
                            previouslySelectedSlot.classList.remove('last-pick');
                        }
                        previouslySelectedSlot = slot;
                        slot.classList.add('last-pick');
                        
                        // Переходим к следующему шагу
                        moveToNextStep();
                        
                        // Оповещаем админ-панель о выборе
                        updateDraftStateForAdmin();
                    }
                }
            });
        });
        
        // Для выбора героев
        document.querySelectorAll('.hero-slot').forEach(slot => {
            slot.addEventListener('click', function() {
                if (isDraftActive && slot.classList.contains('active-slot')) {
                    // Обрабатываем клик по активному слоту выбора
                    const currentStep = draftSequence[currentSequenceIndex];
                    if (currentStep.type === 'pick' || (currentStep.type === 'double-pick' && 
                        currentStep.slots.includes(parseInt(slot.id.split('-')[2])))) {
                        
                        // Имитируем выбор случайного героя из списка
                        const heroes = ["Alucard", "Layla", "Miya", "Tigreal", "Eudora", "Saber", "Balmond", "Nana", "Zilong", "Franco"];
                        const randomHero = heroes[Math.floor(Math.random() * heroes.length)];
                        
                        // Обновляем внешний вид слота
                        const imgElement = slot.querySelector('.hero-img');
                        const nameElement = slot.querySelector('.hero-name');
                        const heroesFolder = 'heroes';
                        const imageExtension = '.png';
                        imgElement.src = `${heroesFolder}/${randomHero.toLowerCase()}${imageExtension}`;
                        nameElement.textContent = randomHero;
                        
                        // Добавляем анимацию выбора
                        slot.classList.remove('active-slot');
                        slot.classList.add('hero-selected', 'hero-appear');
                        
                        // Сохраняем информацию о выбранном слоте
                        const team = currentStep.team;
                        const slotNumber = parseInt(slot.id.split('-')[2]);
                        selectedSlots[`pick-${team}`].push(slotNumber);
                        
                        // Сохраняем слот как предыдущий выбранный
                        if (previouslySelectedSlot) {
                            previouslySelectedSlot.classList.remove('last-pick');
                        }
                        previouslySelectedSlot = slot;
                        slot.classList.add('last-pick');
                        
                        // Проверяем, завершен ли двойной выбор
                        if (currentStep.type === 'double-pick') {
                            const selectedCount = selectedSlots[`pick-${team}`].filter(num => 
                                currentStep.slots.includes(num)).length;
                            
                            if (selectedCount >= currentStep.slots.length) {
                                // Если все слоты в двойном выборе выбраны, переходим к следующему шагу
                                moveToNextStep();
                            }
                        } else {
                            // Обычный выбор, сразу переходим к следующему шагу
                            moveToNextStep();
                        }
                        
                        // Оповещаем админ-панель о выборе
                        updateDraftStateForAdmin();
                    }
                }
            });
        });
    }

    // Переход к следующему шагу
    function moveToNextStep() {
        // Увеличиваем индекс текущего шага
        currentSequenceIndex++;
        
        // Проверяем, не закончился ли драфт
        if (currentSequenceIndex >= draftSequence.length) {
            // Драфт завершен
            clearInterval(timerInterval);
            isDraftActive = false;
            
            // Обновляем UI
            if (phaseIndicator) {
                phaseIndicator.textContent = 'ДРАФТ ЗАВЕРШЕН';
                phaseIndicator.className = 'draft-phase-indicator';
            }
            
            if (startButton) {
                startButton.textContent = 'Запустить драфт';
            }
            
            // Добавляем класс завершения драфта для красивой анимации
            document.querySelector('.overlay-container').classList.add('draft-complete');
            
            // Обновляем сохраненное состояние для админ-панели
            updateDraftStateForAdmin();
            
            return;
        }
        
        // Запускаем новый таймер
        startTimer();
        
        // Выделяем активный слот
        highlightActiveSlot();
        
        // Обновляем индикатор фазы
        updatePhaseIndicator();
        
        // Обновляем сохраненное состояние для админ-панели
        updateDraftStateForAdmin();
    }

    // Обновление состояния драфта для админ-панели
    function updateDraftStateForAdmin() {
        const draftState = {
            isActive: isDraftActive,
            isPaused: !isDraftActive,
            currentStep: currentSequenceIndex,
            currentSequence: currentSequenceIndex < draftSequence.length ? draftSequence[currentSequenceIndex] : null,
            phase: currentSequenceIndex < draftSequence.length ? draftSequence[currentSequenceIndex].phase : 'ДРАФТ ЗАВЕРШЕН',
            timer: timerValue,
            isCompleted: currentSequenceIndex >= draftSequence.length,
            selectedSlots: selectedSlots
        };
        
        localStorage.setItem('mlbbDraftState', JSON.stringify(draftState));
    }

    // Функция для воспроизведения анимации появления (для первоначального отображения)
    function playAnimations() {
        // Сначала удаляем все классы анимации, чтобы сбросить их
        const banSlots = document.querySelectorAll('.ban-slot');
        const heroSlots = document.querySelectorAll('.hero-slot');
        
        banSlots.forEach(slot => {
            slot.style.opacity = 0;
            // Форсируем перерисовку
            void slot.offsetWidth;
        });
        
        heroSlots.forEach(slot => {
            slot.style.opacity = 0;
            // Форсируем перерисовку
            void slot.offsetWidth;
        });
        
        // Затем добавляем классы анимации с задержкой, чтобы они запустились заново
        setTimeout(() => {
            banSlots.forEach(slot => {
                slot.style.opacity = '';
            });
            
            heroSlots.forEach(slot => {
                slot.style.opacity = '';
            });
        }, 50);
    }

    // Обработка сигналов от admin.js (через localStorage)
    function initStorageListener() {
        window.addEventListener('storage', function(e) {
            if (e.key === 'mlbbDraftState') {
                // Обновляем состояние драфта из админ-панели
                checkDraftStateFromAdmin();
            }
        });
    }

    // Инициализация
    function init() {
        // Проверяем наличие сохраненного состояния драфта
        const draftState = localStorage.getItem('mlbbDraftState');
        if (draftState) {
            try {
                const state = JSON.parse(draftState);
                
                // Если драфт активен или завершен, создаем UI
                if (state.isActive || state.isCompleted) {
                    createDraftUI();
                    checkDraftStateFromAdmin();
                }
            } catch (error) {
                console.error('Ошибка при проверке состояния драфта:', error);
            }
        }
        
        // Инициализируем слушатель localStorage
        initStorageListener();
        
        // Обработка клавиатурных сокращений
        document.addEventListener('keydown', function(e) {
            // Space для старта/паузы драфта
            if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                if (!isDraftActive) {
                    startDraft();
                    if (startButton) {
                        startButton.textContent = 'Пауза';
                    }
                } else {
                    pauseDraft();
                    if (startButton) {
                        startButton.textContent = 'Продолжить';
                    }
                }
            }
            
            // R для сброса драфта
            if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT') {
                resetDraft();
            }
            
            // N для перехода к следующему шагу (для тестирования)
            if ((e.key === 'n' || e.key === 'N') && e.target.tagName !== 'INPUT' && isDraftActive) {
                clearInterval(timerInterval);
                moveToNextStep();
            }
        });
    }
    
    // Запуск инициализации
    setTimeout(init, 1000);
});