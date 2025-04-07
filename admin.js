document.addEventListener('DOMContentLoaded', function() {

    
    // Общее пространство имен для управления системой
    const MLBBDraft = {
        // Базовая конфигурация
        config: {
            // Список доступных героев для тестирования
            heroes: [
                "Alucard",
                "Layla",
                "Miya",
                "Tigreal",
                "Eudora",
                "Saber",
                "Balmond",
                "Nana",
                "Zilong",
                "Franco"
            ],
            
            // Интервал проверки соединения в мс
            connectionCheckInterval: 5000,
            
            // Определение последовательности драфта
            draftSequence: [
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
            ]
        },
        
        // Элементы управления интерфейсом
        ui: {
            // Общие элементы
            connectionStatus: document.getElementById('connection-status'),
            heroesFolderInput: document.getElementById('heroes-folder'),
            imageExtensionSelect: document.getElementById('image-extension'),
            
            // Командные элементы
            blueTeamNameInput: document.getElementById('blue-team-input'),
            redTeamNameInput: document.getElementById('red-team-input'),
            
            // Баны
            blueBanInputs: [
                document.getElementById('blue-ban-1-name'),
                document.getElementById('blue-ban-2-name'),
                document.getElementById('blue-ban-3-name')
            ],
            redBanInputs: [
                document.getElementById('red-ban-1-name'),
                document.getElementById('red-ban-2-name'),
                document.getElementById('red-ban-3-name')
            ],
            
            // Герои
            blueHeroInputs: [
                document.getElementById('blue-hero-1-name'),
                document.getElementById('blue-hero-2-name'),
                document.getElementById('blue-hero-3-name'),
                document.getElementById('blue-hero-4-name'),
                document.getElementById('blue-hero-5-name')
            ],
            redHeroInputs: [
                document.getElementById('red-hero-1-name'),
                document.getElementById('red-hero-2-name'),
                document.getElementById('red-hero-3-name'),
                document.getElementById('red-hero-4-name'),
                document.getElementById('red-hero-5-name')
            ],
            
            // Превью баны
            previewBlueBans: [
                document.getElementById('preview-blue-ban-1'),
                document.getElementById('preview-blue-ban-2'),
                document.getElementById('preview-blue-ban-3')
            ],
            previewRedBans: [
                document.getElementById('preview-red-ban-1'),
                document.getElementById('preview-red-ban-2'),
                document.getElementById('preview-red-ban-3')
            ],
            
            // Превью герои
            previewBlueHeroes: [
                document.getElementById('preview-blue-hero-1'),
                document.getElementById('preview-blue-hero-2'),
                document.getElementById('preview-blue-hero-3'),
                document.getElementById('preview-blue-hero-4'),
                document.getElementById('preview-blue-hero-5')
            ],
            previewRedHeroes: [
                document.getElementById('preview-red-hero-1'),
                document.getElementById('preview-red-hero-2'),
                document.getElementById('preview-red-hero-3'),
                document.getElementById('preview-red-hero-4'),
                document.getElementById('preview-red-hero-5')
            ],
            
            // Кнопки управления основным функционалом
            applyTeamNamesBtn: document.getElementById('apply-team-names'),
            applyBansBtn: document.getElementById('apply-bans'),
            applyHeroesBtn: document.getElementById('apply-heroes'),
            applyAllBtn: document.getElementById('apply-all'),
            resetAllBtn: document.getElementById('reset-all'),
            
            // Кнопки управления драфтом
            startDraftBtn: document.getElementById('start-draft'),
            resetDraftBtn: document.getElementById('reset-draft'),
            nextStepBtn: document.getElementById('next-step'),
            draftPhaseDisplay: document.getElementById('draft-phase-display'),
            draftTimerDisplay: document.getElementById('draft-timer-display')
        },
        
        // Состояние системы
        state: {
            // Состояние драфта
            isDraftActive: false,
            currentSequenceIndex: 0,
            timerValue: 30,
            timerInterval: null,
            selectedSlots: {
                'ban-blue': [],
                'ban-red': [],
                'pick-blue': [],
                'pick-red': []
            },
            previouslySelectedSlot: null
        },
        
        // Инициализация системы
        init: function() {
            this.initBasicFunctions();
            this.initDraftFunctions();
            
            // Проверка соединения и загрузка сохраненного состояния
            this.checkConnection();
            this.loadState();
            
            // Установка регулярной проверки соединения
            setInterval(() => this.checkConnection(), this.config.connectionCheckInterval);
            
            console.log('Система управления MLBB драфтом инициализирована');
        },
        
        // Инициализация базовых функций управления
        initBasicFunctions: function() {
            // Настройка команд
            this.ui.applyTeamNamesBtn.addEventListener('click', () => this.applyTeamNames());
            
            // Управление банами и героями
            this.ui.applyBansBtn.addEventListener('click', () => this.applyBans());
            this.ui.applyHeroesBtn.addEventListener('click', () => this.applyHeroes());
            
            // Применение всех изменений
            this.ui.applyAllBtn.addEventListener('click', () => {
                this.applyTeamNames();
                this.applyBans();
                this.applyHeroes();
                this.showNotification('Все изменения применены');
            });
            
            // Сброс всех настроек
            this.ui.resetAllBtn.addEventListener('click', () => this.resetAll());
        },
        
        // Инициализация функций управления драфтом
        initDraftFunctions: function() {
            // Проверяем наличие элементов управления драфтом
            if (!this.ui.startDraftBtn || !this.ui.resetDraftBtn || !this.ui.nextStepBtn ||
                !this.ui.draftPhaseDisplay || !this.ui.draftTimerDisplay) {
                console.error('Элементы управления драфтом не найдены');
                return;
            }
            
            // Управление драфтом
            this.ui.startDraftBtn.addEventListener('click', () => this.toggleDraft());
            this.ui.resetDraftBtn.addEventListener('click', () => this.resetDraft());
            
            // Кнопка следующего шага
            this.ui.nextStepBtn.addEventListener('click', () => {
                if (this.state.isDraftActive) {
                    clearInterval(this.state.timerInterval);
                    this.moveToNextStep();
                }
            });
            
            // Обработчики для входных полей
            this.setupDraftInputHandlers();
            
            // Клавиатурные сокращения
            this.setupDraftKeyboardShortcuts();
            
            // Сброс состояния драфта при инициализации
            this.resetDraft();
        },
        
        // Настройка обработчиков для автоматического перехода после выбора героя или бана
        setupDraftInputHandlers: function() {
            // Объединяем все поля ввода героев и банов
            const allBanInputs = [...this.ui.blueBanInputs, ...this.ui.redBanInputs];
            const allHeroInputs = [...this.ui.blueHeroInputs, ...this.ui.redHeroInputs];
            
            // Добавляем обработчики на изменение значений полей
            [...allBanInputs, ...allHeroInputs].forEach(input => {
                input.addEventListener('change', () => {
                    // Проверяем, является ли поле активным в текущем шаге
                    const isActiveInput = input.parentElement.classList.contains('active-input') || 
                                      input.parentElement.classList.contains('active-input-red');
                    
                    if (this.state.isDraftActive && isActiveInput && input.value.trim() !== '') {
                        // Автоматически переходим к следующему шагу с небольшой задержкой
                        setTimeout(() => {
                            clearInterval(this.state.timerInterval);
                            this.moveToNextStep();
                        }, 500);
                    }
                });
            });
            
            // Интеграция с кнопками применения банов и героев
            this.ui.applyBansBtn.addEventListener('click', () => {
                if (this.state.isDraftActive) {
                    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
                    if (currentStep.type === 'ban') {
                        // После применения банов автоматически переходим к следующему шагу
                        setTimeout(() => {
                            clearInterval(this.state.timerInterval);
                            this.moveToNextStep();
                        }, 500);
                    }
                }
            });
            
            this.ui.applyHeroesBtn.addEventListener('click', () => {
                if (this.state.isDraftActive) {
                    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
                    if (currentStep.type === 'pick' || currentStep.type === 'double-pick') {
                        // После применения выбора героев автоматически переходим к следующему шагу
                        setTimeout(() => {
                            clearInterval(this.state.timerInterval);
                            this.moveToNextStep();
                        }, 500);
                    }
                }
            });
        },
        
        // Настройка клавиатурных сокращений для управления драфтом
        setupDraftKeyboardShortcuts: function() {
            document.addEventListener('keydown', (e) => {
                // Пробел для запуска/паузы драфта
                if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.toggleDraft();
                }
                
                // N для перехода к следующему шагу
                if ((e.key === 'n' || e.key === 'N') && e.target.tagName !== 'INPUT' && this.state.isDraftActive) {
                    e.preventDefault();
                    clearInterval(this.state.timerInterval);
                    this.moveToNextStep();
                }
                
                // R для сброса драфта
                if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT' && e.ctrlKey) {
                    e.preventDefault();
                    this.resetDraft();
                }
            });
        },
        
        // ------- БАЗОВЫЕ ФУНКЦИИ УПРАВЛЕНИЯ -------
        
        // Проверка соединения с localStorage
        checkConnection: function() {
            try {
                localStorage.setItem('connectionTest', 'test');
                localStorage.removeItem('connectionTest');
                this.ui.connectionStatus.textContent = 'Подключено';
                this.ui.connectionStatus.className = 'status-connected';
                return true;
            } catch (error) {
                this.ui.connectionStatus.textContent = 'Отключено';
                this.ui.connectionStatus.className = 'status-disconnected';
                console.error('Ошибка доступа к localStorage:', error);
                return false;
            }
        },
        
        // Загрузка сохраненного состояния
        loadState: function() {
            if (!this.checkConnection()) return;
            
            const savedState = localStorage.getItem('mlbbOverlayState');
            if (savedState) {
                try {
                    const state = JSON.parse(savedState);
                    
                    // Загрузка названий команд
                    if (state.blueTeamName) {
                        this.ui.blueTeamNameInput.value = state.blueTeamName;
                        document.getElementById('preview-blue-team-name').textContent = state.blueTeamName;
                    }
                    
                    if (state.redTeamName) {
                        this.ui.redTeamNameInput.value = state.redTeamName;
                        document.getElementById('preview-red-team-name').textContent = state.redTeamName;
                    }
                    
                    // Загрузка данных банов
                    if (state.bans) {
                        // Загрузка банов синей команды
                        if (state.bans.blue) {
                            state.bans.blue.forEach((ban, index) => {
                                if (ban && ban.name) {
                                    this.ui.blueBanInputs[index].value = ban.name;
                                    this.updateBanPreview(`preview-blue-ban-${index + 1}`, ban.name, ban.img);
                                }
                            });
                        }
                        
                        // Загрузка банов красной команды
                        if (state.bans.red) {
                            state.bans.red.forEach((ban, index) => {
                                if (ban && ban.name) {
                                    this.ui.redBanInputs[index].value = ban.name;
                                    this.updateBanPreview(`preview-red-ban-${index + 1}`, ban.name, ban.img);
                                }
                            });
                        }
                    }
                    
                    // Загрузка данных героев
                    if (state.heroes) {
                        Object.keys(state.heroes).forEach(heroId => {
                            const heroData = state.heroes[heroId];
                            const teamType = heroId.includes('blue') ? 'blue' : 'red';
                            const heroNumber = parseInt(heroId.split('-')[2]) - 1;
                            
                            // Обновление превью
                            const previewHeroId = `preview-${teamType}-hero-${heroNumber + 1}`;
                            const previewHeroSlot = document.getElementById(previewHeroId);
                            
                            if (previewHeroSlot) {
                                // Обновление имени героя в превью
                                const heroNameElement = previewHeroSlot.querySelector('.hero-name');
                                if (heroNameElement && heroData.name) {
                                    heroNameElement.textContent = heroData.name;
                                }
                                
                                // Обновление изображения героя в превью
                                const imgElement = previewHeroSlot.querySelector('.hero-img');
                                if (imgElement && heroData.img && !heroData.img.includes('placeholder')) {
                                    imgElement.src = heroData.img;
                                }
                            }
                            
                            // Заполнение полей ввода героев
                            if (teamType === 'blue') {
                                this.ui.blueHeroInputs[heroNumber].value = heroData.name;
                            } else {
                                this.ui.redHeroInputs[heroNumber].value = heroData.name;
                            }
                        });
                    }
                    
                } catch (error) {
                    console.error('Ошибка загрузки сохраненного состояния:', error);
                }
            }
        },
        
        // Сохранение текущего состояния
        saveState: function() {
            if (!this.checkConnection()) {
                alert('Нет доступа к localStorage. Невозможно сохранить состояние.');
                return;
            }
            
            // Создаем объект состояния
            const state = {
                blueTeamName: document.getElementById('preview-blue-team-name').textContent,
                redTeamName: document.getElementById('preview-red-team-name').textContent,
                bans: {
                    blue: [],
                    red: []
                },
                heroes: {}
            };
            
            // Сохраняем данные о банах
            const heroesFolder = this.ui.heroesFolderInput.value || 'heroes';
            const imageExtension = this.ui.imageExtensionSelect.value || '.png';
            
            // Сохраняем баны синей команды
            this.ui.blueBanInputs.forEach((input, index) => {
                const banName = input.value.trim();
                if (banName) {
                    const banId = `preview-blue-ban-${index + 1}`;
                    const previewImgElement = document.querySelector(`#${banId} .ban-img`);
                    let banImgUrl;
                    
                    if (previewImgElement && previewImgElement.src && !previewImgElement.src.includes('placeholder')) {
                        banImgUrl = previewImgElement.src;
                    } else {
                        banImgUrl = this.getHeroImageUrl(banName, heroesFolder, imageExtension);
                    }
                    
                    state.bans.blue[index] = {
                        name: banName,
                        img: banImgUrl
                    };
                }
            });
            
            // Сохраняем баны красной команды
            this.ui.redBanInputs.forEach((input, index) => {
                const banName = input.value.trim();
                if (banName) {
                    const banId = `preview-red-ban-${index + 1}`;
                    const previewImgElement = document.querySelector(`#${banId} .ban-img`);
                    let banImgUrl;
                    
                    if (previewImgElement && previewImgElement.src && !previewImgElement.src.includes('placeholder')) {
                        banImgUrl = previewImgElement.src;
                    } else {
                        banImgUrl = this.getHeroImageUrl(banName, heroesFolder, imageExtension);
                    }
                    
                    state.bans.red[index] = {
                        name: banName,
                        img: banImgUrl
                    };
                }
            });
            
            // Сохраняем данные о героях
            const heroSlots = [
                ...this.ui.blueHeroInputs.map((input, index) => ({
                    id: `blue-hero-${index + 1}`, 
                    input, 
                    previewId: `preview-blue-hero-${index + 1}`
                })),
                ...this.ui.redHeroInputs.map((input, index) => ({
                    id: `red-hero-${index + 1}`, 
                    input, 
                    previewId: `preview-red-hero-${index + 1}`
                }))
            ];
            
            heroSlots.forEach(slot => {
                const heroName = slot.input.value.trim();
                if (heroName) {
                    // Получаем текущее изображение из превью
                    const previewImgElement = document.querySelector(`#${slot.previewId} .hero-img`);
                    let heroImgUrl;
                    
                    // Если изображение не placeholder и уже загружено успешно, используем его
                    if (previewImgElement && previewImgElement.src && !previewImgElement.src.includes('placeholder')) {
                        heroImgUrl = previewImgElement.src;
                    } else {
                        // Формируем URL изображения из папки по имени героя
                        heroImgUrl = this.getHeroImageUrl(heroName, heroesFolder, imageExtension);
                    }
                    
                    state.heroes[slot.id] = {
                        name: heroName,
                        img: heroImgUrl
                    };
                } else {
                    // Если имя героя не указано, используем заполнитель
                    state.heroes[slot.id] = {
                        name: "Герой " + slot.id.split('-')[2],
                        img: '/api/placeholder/120/120'
                    };
                }
            });
            
            // Сохраняем состояние в localStorage
            localStorage.setItem('mlbbOverlayState', JSON.stringify(state));
            console.log('Состояние сохранено:', state);
        },
        
        // Отображение уведомления
        showNotification: function(message) {
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
        },
        
        // Применение названий команд
        applyTeamNames: function() {
            const blueTeamName = this.ui.blueTeamNameInput.value.trim() || 'СИНЯЯ КОМАНДА';
            const redTeamName = this.ui.redTeamNameInput.value.trim() || 'КРАСНАЯ КОМАНДА';
            
            // Обновление превью
            document.getElementById('preview-blue-team-name').textContent = blueTeamName;
            document.getElementById('preview-red-team-name').textContent = redTeamName;
            
            // Сохранение состояния
            this.saveState();
        },
        
        // Обновление превью бана
        updateBanPreview: function(banId, heroName, customImgUrl = null) {
            const banSlot = document.getElementById(banId);
            if (!banSlot) return;
            
            const imgElement = banSlot.querySelector('.ban-img');
            
            if (heroName && heroName.trim() !== '') {
                // Если предоставлен пользовательский URL изображения, используем его
                if (customImgUrl && !customImgUrl.includes('placeholder')) {
                    imgElement.src = customImgUrl;
                } else {
                    // Формируем URL изображения
                    const heroesFolder = this.ui.heroesFolderInput.value || 'heroes';
                    const imageExtension = this.ui.imageExtensionSelect.value || '.png';
                    const heroImgUrl = this.getHeroImageUrl(heroName, heroesFolder, imageExtension);
                    
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
        },
        
        // Применение банов
        applyBans: function() {
            const heroesFolder = this.ui.heroesFolderInput.value || 'heroes';
            const imageExtension = this.ui.imageExtensionSelect.value || '.png';
            
            // Обновление банов синей команды
            this.ui.blueBanInputs.forEach((input, index) => {
                this.updateBanPreview(`preview-blue-ban-${index + 1}`, input.value);
            });
            
            // Обновление банов красной команды
            this.ui.redBanInputs.forEach((input, index) => {
                this.updateBanPreview(`preview-red-ban-${index + 1}`, input.value);
            });
            
            // Сохранение состояния
            this.saveState();
        },
        
        
        // Обновление превью героя
        updateHeroPreview: function(previewId, heroName, folder, extension) {
            const heroSlot = document.getElementById(previewId);
            if (!heroSlot) return;
            
            const heroNameElement = heroSlot.querySelector('.hero-name');
            const imgElement = heroSlot.querySelector('.hero-img');
            
            if (heroName && heroName.trim() !== '') {
                heroNameElement.textContent = heroName;
                
                // Формируем URL изображения
                const heroImgUrl = this.getHeroImageUrl(heroName, folder, extension);
                
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
        },
        
        // Применение выбора героев
        applyHeroes: function() {
            const heroesFolder = this.ui.heroesFolderInput.value || 'heroes';
            const imageExtension = this.ui.imageExtensionSelect.value || '.png';
            
            // Обновление героев синей команды
            this.ui.blueHeroInputs.forEach((input, index) => {
                this.updateHeroPreview(`preview-blue-hero-${index + 1}`, input.value, heroesFolder, imageExtension);
            });
            
            // Обновление героев красной команды
            this.ui.redHeroInputs.forEach((input, index) => {
                this.updateHeroPreview(`preview-red-hero-${index + 1}`, input.value, heroesFolder, imageExtension);
            });
            
            // Сохранение состояния
            this.saveState();
        },
        
        // Получение URL изображения героя
        // Получение URL изображения героя
getHeroImageUrl: function(heroName, folder, extension) {
    if (!heroName || heroName.trim() === '') {
        return '/api/placeholder/120/120';
    }
    
    // Обработка имени героя (замена пробелов, дефисов и т.д. на подчеркивания)
    const processedName = heroName.toLowerCase().replace(/[\s'-]+/g, '_');
    
    // Используем путь, который будет работать в вашей среде
    return `${folder}/${processedName}${extension}`;
},

// Сброс всех настроек
resetAll: function() {
    if (confirm('Вы уверены, что хотите сбросить все настройки?')) {
        // Сброс названий команд
        this.ui.blueTeamNameInput.value = 'СИНЯЯ КОМАНДА';
        this.ui.redTeamNameInput.value = 'КРАСНАЯ КОМАНДА';
        document.getElementById('preview-blue-team-name').textContent = 'СИНЯЯ КОМАНДА';
        document.getElementById('preview-red-team-name').textContent = 'КРАСНАЯ КОМАНДА';
        
        // Сброс банов
        this.ui.blueBanInputs.forEach(input => input.value = '');
        this.ui.redBanInputs.forEach(input => input.value = '');
        
        // Сброс превью банов
        for (let i = 1; i <= 3; i++) {
            const blueBanId = `preview-blue-ban-${i}`;
            const redBanId = `preview-red-ban-${i}`;
            
            const blueBanSlot = document.getElementById(blueBanId);
            const redBanSlot = document.getElementById(redBanId);
            
            if (blueBanSlot) {
                blueBanSlot.querySelector('.ban-img').src = '/api/placeholder/120/120';
            }
            
            if (redBanSlot) {
                redBanSlot.querySelector('.ban-img').src = '/api/placeholder/120/120';
            }
        }
        
        // Сброс имен героев
        this.ui.blueHeroInputs.forEach(input => input.value = '');
        this.ui.redHeroInputs.forEach(input => input.value = '');
        
        // Сброс превью героев
        for (let i = 1; i <= 5; i++) {
            const bluePreviewId = `preview-blue-hero-${i}`;
            const redPreviewId = `preview-red-hero-${i}`;
            
            const blueHeroSlot = document.getElementById(bluePreviewId);
            const redHeroSlot = document.getElementById(redPreviewId);
            
            if (blueHeroSlot) {
                blueHeroSlot.querySelector('.hero-name').textContent = `Герой ${i}`;
                blueHeroSlot.querySelector('.hero-img').src = '/api/placeholder/120/120';
            }
            
            if (redHeroSlot) {
                redHeroSlot.querySelector('.hero-name').textContent = `Герой ${i}`;
                redHeroSlot.querySelector('.hero-img').src = '/api/placeholder/120/120';
            }
        }
        
        // Сброс настроек изображений
        this.ui.heroesFolderInput.value = 'heroes';
        this.ui.imageExtensionSelect.value = '.png';
        
        // Сброс драфта если активен
        this.resetDraft();
        
        // Очистка localStorage
        localStorage.removeItem('mlbbOverlayState');
        localStorage.removeItem('mlbbDraftState');
        
        this.showNotification('Все настройки сброшены');
    }
},

// ------- ФУНКЦИИ УПРАВЛЕНИЯ ДРАФТОМ -------

// Запуск или пауза драфта
toggleDraft: function() {
    if (!this.state.isDraftActive) {
        this.startDraft();
    } else {
        this.pauseDraft();
    }
},

// Запуск драфта
startDraft: function() {
    // Запуск нового драфта
    this.state.isDraftActive = true;
    this.state.currentSequenceIndex = 0;
    this.state.selectedSlots = {
        'ban-blue': [],
        'ban-red': [],
        'pick-blue': [],
        'pick-red': []
    };
    
    // Обновляем интерфейс
    this.ui.startDraftBtn.textContent = 'Пауза драфта';
    this.ui.nextStepBtn.disabled = false;
    
    // Запускаем первый шаг
    this.startDraftStep();
    
    // Синхронизация с viewer.html через localStorage
    this.updateDraftStateForViewer();
},

// Постановка драфта на паузу
pauseDraft: function() {
    this.state.isDraftActive = false;
    clearInterval(this.state.timerInterval);
    this.ui.startDraftBtn.textContent = 'Продолжить драфт';
    
    // Обновление статуса в localStorage для viewer.html
    const draftState = JSON.parse(localStorage.getItem('mlbbDraftState') || '{}');
    draftState.isPaused = true;
    localStorage.setItem('mlbbDraftState', JSON.stringify(draftState));
},

// Сброс драфта
resetDraft: function() {
    // Сброс всех переменных состояния
    this.state.isDraftActive = false;
    this.state.currentSequenceIndex = 0;
    this.state.timerValue = 30;
    clearInterval(this.state.timerInterval);
    
    // Сброс интерфейса
    if (this.ui.startDraftBtn) this.ui.startDraftBtn.textContent = 'Запустить драфт';
    if (this.ui.draftPhaseDisplay) this.ui.draftPhaseDisplay.textContent = 'СТАТУС: ОЖИДАНИЕ';
    if (this.ui.draftPhaseDisplay) this.ui.draftPhaseDisplay.className = 'draft-phase-display';
    if (this.ui.draftTimerDisplay) this.ui.draftTimerDisplay.textContent = '30';
    if (this.ui.draftTimerDisplay) this.ui.draftTimerDisplay.className = 'draft-timer-display';
    if (this.ui.nextStepBtn) this.ui.nextStepBtn.disabled = false;
    
    // Сброс выделения активных слотов
    this.resetActiveSlots();
    
    // Сброс состояния в localStorage для viewer.html
    localStorage.setItem('mlbbDraftState', JSON.stringify({
        isActive: false,
        isPaused: false,
        currentStep: 0,
        timer: 30
    }));
},

// Сброс выделения активных слотов
resetActiveSlots: function() {
    // Удаляем классы активности со всех полей ввода
    document.querySelectorAll('.hero-input').forEach(input => {
        input.classList.remove('active-input', 'active-input-red', 'completed');
    });
    
    // Удаляем классы активности со всех слотов предпросмотра
    document.querySelectorAll('.preview .ban-slot, .preview .hero-slot').forEach(slot => {
        slot.classList.remove('active-slot');
    });
},

// Запуск текущего шага драфта
startDraftStep: function() {
    if (this.state.currentSequenceIndex >= this.config.draftSequence.length) {
        // Драфт завершен
        this.completeDraft();
        return;
    }
    
    // Получаем текущий шаг
    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
    
    // Обновляем отображение фазы
    this.updatePhaseDisplay(currentStep);
    
    // Выделяем активные слоты
    this.highlightActiveSlots(currentStep);
    
    // Запускаем таймер
    this.startTimer();
    
    // Обновляем состояние для viewer.html
    this.updateDraftStateForViewer();
},

// Обновление отображения текущей фазы
updatePhaseDisplay: function(step) {
    if (!this.ui.draftPhaseDisplay) return;
    
    this.ui.draftPhaseDisplay.textContent = step.phase;
    this.ui.draftPhaseDisplay.className = 'draft-phase-display';
    
    if (step.team === 'blue') {
        this.ui.draftPhaseDisplay.classList.add('draft-phase-blue');
    } else {
        this.ui.draftPhaseDisplay.classList.add('draft-phase-red');
    }
},

// Выделение активных слотов
highlightActiveSlots: function(step) {
    // Сначала сбрасываем все активные слоты
    this.resetActiveSlots();
    
    if (step.type === 'ban') {
        // Выделяем соответствующий слот бана
        const input = step.team === 'blue' 
            ? this.ui.blueBanInputs[step.slot - 1] 
            : this.ui.redBanInputs[step.slot - 1];
        
        const inputContainer = input.parentElement;
        if (step.team === 'blue') {
            inputContainer.classList.add('active-input');
        } else {
            inputContainer.classList.add('active-input-red');
        }
        
        // Выделяем соответствующий слот в предпросмотре
        const previewSlot = document.getElementById(`preview-${step.team}-ban-${step.slot}`);
        if (previewSlot) {
            previewSlot.classList.add('active-slot');
        }
    } 
    else if (step.type === 'pick') {
        // Выделяем соответствующий слот выбора героя
        const input = step.team === 'blue' 
            ? this.ui.blueHeroInputs[step.slot - 1] 
            : this.ui.redHeroInputs[step.slot - 1];
        
        const inputContainer = input.parentElement;
        if (step.team === 'blue') {
            inputContainer.classList.add('active-input');
        } else {
            inputContainer.classList.add('active-input-red');
        }
        
        // Выделяем соответствующий слот в предпросмотре
        const previewSlot = document.getElementById(`preview-${step.team}-hero-${step.slot}`);
        if (previewSlot) {
            previewSlot.classList.add('active-slot');
        }
    }
    else if (step.type === 'double-pick') {
        // Выделяем оба слота для двойного выбора
        step.slots.forEach(slotNum => {
            const input = step.team === 'blue' 
                ? this.ui.blueHeroInputs[slotNum - 1] 
                : this.ui.redHeroInputs[slotNum - 1];
            
            const inputContainer = input.parentElement;
            if (step.team === 'blue') {
                inputContainer.classList.add('active-input');
            } else {
                inputContainer.classList.add('active-input-red');
            }
            
            // Выделяем соответствующие слоты в предпросмотре
            const previewSlot = document.getElementById(`preview-${step.team}-hero-${slotNum}`);
            if (previewSlot) {
                previewSlot.classList.add('active-slot');
            }
        });
    }
},

// Запуск таймера для текущего шага
startTimer: function() {
    // Сбрасываем предыдущий таймер
    clearInterval(this.state.timerInterval);
    
    // Начальное значение таймера
    this.state.timerValue = 30;
    this.updateTimerDisplay();
    
    // Запускаем обратный отсчет
    this.state.timerInterval = setInterval(() => {
        this.state.timerValue--;
        this.updateTimerDisplay();
        
        // Обновляем состояние для viewer.html
        this.updateDraftStateForViewer();
        
        if (this.state.timerValue <= 0) {
            // Время вышло, переходим к следующему шагу
            clearInterval(this.state.timerInterval);
            this.moveToNextStep();
        }
    }, 1000);
},

// Обновление отображения таймера
updateTimerDisplay: function() {
    if (!this.ui.draftTimerDisplay) return;
    
    this.ui.draftTimerDisplay.textContent = this.state.timerValue;
    this.ui.draftTimerDisplay.className = 'draft-timer-display';
    
    if (this.state.timerValue <= 5) {
        this.ui.draftTimerDisplay.classList.add('draft-timer-critical');
    } else if (this.state.timerValue <= 10) {
        this.ui.draftTimerDisplay.classList.add('draft-timer-warning');
    }
},

// Переход к следующему шагу драфта
moveToNextStep: function() {
    // Отмечаем текущий шаг как завершенный
    this.markCurrentStepCompleted();
    
    // Увеличиваем индекс текущего шага
    this.state.currentSequenceIndex++;
    
    // Если это не последний шаг, запускаем следующий
    if (this.state.currentSequenceIndex < this.config.draftSequence.length) {
        this.startDraftStep();
    } else {
        // Драфт завершен
        this.completeDraft();
    }
},

// Отметка текущего шага как завершенного
// Модифицированный метод markCurrentStepCompleted
markCurrentStepCompleted: function() {
    if (this.state.currentSequenceIndex >= this.config.draftSequence.length) return;
    
    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
    
    // Для обычных шагов бана или одиночного пика
    if (currentStep.type === 'ban' || currentStep.type === 'pick') {
        let inputContainer;
        
        if (currentStep.type === 'ban') {
            inputContainer = (currentStep.team === 'blue' 
                ? this.ui.blueBanInputs[currentStep.slot - 1] 
                : this.ui.redBanInputs[currentStep.slot - 1]).parentElement;
        } else {
            inputContainer = (currentStep.team === 'blue' 
                ? this.ui.blueHeroInputs[currentStep.slot - 1] 
                : this.ui.redHeroInputs[currentStep.slot - 1]).parentElement;
        }
        
        // Проверяем, что слот заполнен
        const input = inputContainer.querySelector('input');
        if (input.value.trim() === '') return;
        
        inputContainer.classList.remove('active-input', 'active-input-red');
        inputContainer.classList.add('completed');
        
        // Применяем соответствующие изменения
        if (currentStep.type === 'ban') {
            this.applyBan(currentStep.team, currentStep.slot);
        } else {
            this.applyHero(currentStep.team, currentStep.slot);
        }
    }
    // Для двойных пиков
    else if (currentStep.type === 'double-pick') {
        const inputs = currentStep.slots.map(slotNum => 
            currentStep.team === 'blue' 
                ? this.ui.blueHeroInputs[slotNum - 1] 
                : this.ui.redHeroInputs[slotNum - 1]
        );
        
        // Обрабатываем каждый заполненный слот
        currentStep.slots.forEach((slotNum, index) => {
            const input = inputs[index];
            
            // Если слот заполнен
            if (input.value.trim() !== '') {
                const inputContainer = input.parentElement;
                
                inputContainer.classList.remove('active-input', 'active-input-red');
                inputContainer.classList.add('completed');
                
                // Применяем изменения для героя
                this.applyHero(currentStep.team, slotNum);
            }
        });
        
        // Проверяем, все ли слоты заполнены
        const allSlotsFilled = inputs.every(input => input.value.trim() !== '');
        
        // Если все слоты заполнены, только тогда переходим к следующему шагу
        if (!allSlotsFilled) {
            return;
        }
    }
},

// Модифицированный метод moveToNextStep
moveToNextStep: function() {
    // Отмечаем текущий шаг как завершенный
    this.markCurrentStepCompleted();
    
    // Если для текущего шага не все условия выполнены (например, не все слоты заполнены),
    // то не переходим к следующему шагу
    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
    if (currentStep.type === 'double-pick') {
        const inputs = currentStep.slots.map(slotNum => 
            currentStep.team === 'blue' 
                ? this.ui.blueHeroInputs[slotNum - 1] 
                : this.ui.redHeroInputs[slotNum - 1]
        );
        
        const allSlotsFilled = inputs.every(input => input.value.trim() !== '');
        
        if (!allSlotsFilled) {
            return;
        }
    }
    
    // Увеличиваем индекс текущего шага
    this.state.currentSequenceIndex++;
    
    // Если это не последний шаг, запускаем следующий
    if (this.state.currentSequenceIndex < this.config.draftSequence.length) {
        this.startDraftStep();
    } else {
        // Драфт завершен
        this.completeDraft();
    }
},

// Автоматически применяем бан
applyBan: function(team, slotNum) {
    const banInput = team === 'blue' 
        ? this.ui.blueBanInputs[slotNum - 1] 
        : this.ui.redBanInputs[slotNum - 1];
    
    if (banInput.value.trim() === '') {
        // Если поле пустое, можно выбрать случайного героя или оставить пустым
        return;
    }
    
    // Обновляем в превью и сохраняем в localStorage
    const banSlotId = `preview-${team}-ban-${slotNum}`;
    this.updateBanPreview(banSlotId, banInput.value);
    
    // Сохраняем состояние
    this.saveState();
},

// Автоматически применяем выбор героя
applyHero: function(team, slotNum) {
    const heroInput = team === 'blue' 
        ? this.ui.blueHeroInputs[slotNum - 1] 
        : this.ui.redHeroInputs[slotNum - 1];
    
    if (heroInput.value.trim() === '') {
        // Если поле пустое, можно выбрать случайного героя или оставить пустым
        return;
    }
    
    // Обновляем в превью и сохраняем в localStorage
    const heroSlotId = `preview-${team}-hero-${slotNum}`;
    const heroesFolder = this.ui.heroesFolderInput.value || 'heroes';
    const imageExtension = this.ui.imageExtensionSelect.value || '.jpg';
    
    this.updateHeroPreview(heroSlotId, heroInput.value, heroesFolder, imageExtension);
    
    // Сохраняем состояние
    this.saveState();
},

// Завершение драфта
completeDraft: function() {
    this.state.isDraftActive = false;
    clearInterval(this.state.timerInterval);
    
    // Обновляем интерфейс
    if (this.ui.draftPhaseDisplay) this.ui.draftPhaseDisplay.textContent = 'ДРАФТ ЗАВЕРШЕН';
    if (this.ui.draftPhaseDisplay) this.ui.draftPhaseDisplay.className = 'draft-phase-display';
    if (this.ui.startDraftBtn) this.ui.startDraftBtn.textContent = 'Запустить драфт';
    if (this.ui.draftTimerDisplay) this.ui.draftTimerDisplay.textContent = '0';
    if (this.ui.nextStepBtn) this.ui.nextStepBtn.disabled = true;
    
    // Обновляем состояние для viewer.html
    localStorage.setItem('mlbbDraftState', JSON.stringify({
        isActive: false,
        isPaused: false,
        currentStep: this.config.draftSequence.length,
        phase: 'ДРАФТ ЗАВЕРШЕН',
        timer: 0,
        isCompleted: true
    }));
    
    // Показываем уведомление пользователю
    this.showNotification('Драфт успешно завершен');
},

// Обновление состояния драфта для viewer.html
updateDraftStateForViewer: function() {
    if (this.state.currentSequenceIndex >= this.config.draftSequence.length) return;
    
    const currentStep = this.config.draftSequence[this.state.currentSequenceIndex];
    const draftState = {
        isActive: this.state.isDraftActive,
        isPaused: !this.state.isDraftActive,
        currentStep: this.state.currentSequenceIndex,
        currentSequence: currentStep,
        phase: currentStep.phase,
        timer: this.state.timerValue,
        isCompleted: false
    };
    
    localStorage.setItem('mlbbDraftState', JSON.stringify(draftState));
}
};

// Экспорт объекта MLBBDraft в глобальную область видимости
window.MLBBDraft = MLBBDraft;

// Запуск инициализации
MLBBDraft.init();
});