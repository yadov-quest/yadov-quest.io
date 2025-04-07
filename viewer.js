document.addEventListener('DOMContentLoaded', function() {
    // Интервал обновления данных в мс
    const UPDATE_INTERVAL = 1000;
    
    // Переменные для управления драфтом
    let isDraftActive = false;
    let timerInterval = null;
    let draftTimer = 30;
    let currentSequenceIndex = 0;
    
    // Элементы для таймера и индикатора фазы
    let timerContainer = null;
    let phaseIndicator = null;
    let timerBar = null;
    let timerTimeElement = null;
    

    
    // Получение данных из localStorage
    function loadState() {
        const savedState = localStorage.getItem('mlbbOverlayState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                
                // Загрузка названий команд
                if (state.blueTeamName) {
                    document.getElementById('blue-team-name').textContent = state.blueTeamName;
                }
                
                if (state.redTeamName) {
                    document.getElementById('red-team-name').textContent = state.redTeamName;
                }
                
                // Загрузка данных банов
                if (state.bans) {
                    // Баны синей команды
                    if (state.bans.blue) {
                        state.bans.blue.forEach((ban, index) => {
                            if (ban && ban.name) {
                                const banId = `blue-ban-${index + 1}`;
                                const banSlot = document.getElementById(banId);
                                
                                if (banSlot) {
                                    const imgElement = banSlot.querySelector('.ban-img');
                                    if (imgElement && ban.img && !ban.img.includes('placeholder')) {
                                        // Сохраняем текущий URL изображения перед его изменением
                                        const originalSrc = imgElement.src;
                                        imgElement.src = ban.img;
                                        
                                        imgElement.onerror = function() {
                                            console.error(`Ошибка загрузки изображения бана: ${ban.img}`);
                                            // Если изображение было уже не placeholder, сохраняем его и не сбрасываем
                                            if (originalSrc && !originalSrc.includes('placeholder')) {
                                                console.log(`Сохраняем предыдущее изображение: ${originalSrc}`);
                                                this.src = originalSrc;
                                            } else {
                                                this.src = '/api/placeholder/120/120';
                                            }
                                        };
                                    }
                                }
                            }
                        });
                    }
                    
                    // Баны красной команды
                    if (state.bans.red) {
                        state.bans.red.forEach((ban, index) => {
                            if (ban && ban.name) {
                                const banId = `red-ban-${index + 1}`;
                                const banSlot = document.getElementById(banId);
                                
                                if (banSlot) {
                                    const imgElement = banSlot.querySelector('.ban-img');
                                    if (imgElement && ban.img && !ban.img.includes('placeholder')) {
                                        // Сохраняем текущий URL изображения перед его изменением
                                        const originalSrc = imgElement.src;
                                        imgElement.src = ban.img;
                                        
                                        imgElement.onerror = function() {
                                            console.error(`Ошибка загрузки изображения бана: ${ban.img}`);
                                            // Если изображение было уже не placeholder, сохраняем его и не сбрасываем
                                            if (originalSrc && !originalSrc.includes('placeholder')) {
                                                console.log(`Сохраняем предыдущее изображение: ${originalSrc}`);
                                                this.src = originalSrc;
                                            } else {
                                                this.src = '/api/placeholder/120/120';
                                            }
                                        };
                                    }
                                }
                            }
                        });
                    }
                }
                
                // Загрузка данных героев
                if (state.heroes) {
                    Object.keys(state.heroes).forEach(heroId => {
                        // Для зрительской страницы необходимо использовать исходный ID
                        const viewerHeroId = heroId;
                        const heroSlot = document.getElementById(viewerHeroId);
                        
                        if (heroSlot) {
                            const heroData = state.heroes[heroId];
                            
                            // Загрузка имени героя
                            const heroNameElement = heroSlot.querySelector('.hero-name');
                            if (heroNameElement && heroData.name) {
                                heroNameElement.textContent = heroData.name;
                            }
                            
                            // Загрузка изображения героя
                            const imgElement = heroSlot.querySelector('.hero-img');
                            if (imgElement && heroData.img && !heroData.img.includes('placeholder')) {
                                // Сохраняем текущий URL изображения перед его изменением
                                const originalSrc = imgElement.src;
                                imgElement.src = heroData.img;
                                
                                imgElement.onerror = function() {
                                    console.error('Ошибка загрузки изображения: ' + heroData.img);
                                    
                                    // Пробуем альтернативный путь (с и без начального слеша)
                                    let altUrl;
                                    if (heroData.img.startsWith('/')) {
                                        altUrl = heroData.img.substring(1); // Убираем начальный слеш
                                    } else {
                                        altUrl = '/' + heroData.img; // Добавляем начальный слеш
                                    }
                                    
                                    console.log('Пробуем альтернативный путь: ' + altUrl);
                                    this.src = altUrl;
                                    
                                    // Если и это не работает
                                    this.onerror = function() {
                                        console.error('Альтернативный путь также не работает: ' + altUrl);
                                        // Если было не placeholder, возвращаем предыдущее
                                        if (originalSrc && !originalSrc.includes('placeholder')) {
                                            this.src = originalSrc;
                                        } else {
                                            this.src = '/api/placeholder/120/120';
                                        }
                                    };
                                };
                            }
                        }
                    });
                }
                
            } catch (error) {
                console.error('Ошибка загрузки состояния:', error);
            }
        }
    }
    
    // Функция для воспроизведения анимации
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
    
    // Создание UI для драфта

    
    // Обновление состояния драфта из localStorage

    
    // Выделение активных слотов в соответствии с текущим шагом драфта
    function highlightActiveSlots(step) {
        if (!step) return;
        
        // Сначала сбрасываем все активные слоты
        resetActiveSlots();
        
        if (step.type === 'ban') {
            // Выделяем соответствующий слот бана
            const banSlot = document.getElementById(`${step.team}-ban-${step.slot}`);
            if (banSlot) {
                banSlot.classList.add('active-slot');
                // Добавляем анимацию для выделения
                banSlot.classList.add('hero-appear');
            }
        } 
        else if (step.type === 'pick') {
            // Выделяем соответствующий слот выбора героя
            const heroSlot = document.getElementById(`${step.team}-hero-${step.slot}`);
            if (heroSlot) {
                heroSlot.classList.add('active-slot');
                // Добавляем анимацию для выделения
                heroSlot.classList.add('hero-appear');
            }
        }
        else if (step.type === 'double-pick') {
            // Выделяем оба слота для двойного выбора
            step.slots.forEach(slotNum => {
                const heroSlot = document.getElementById(`${step.team}-hero-${slotNum}`);
                if (heroSlot) {
                    heroSlot.classList.add('active-slot');
                    // Добавляем анимацию для выделения
                    heroSlot.classList.add('hero-appear');
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
    
    // Первоначальная загрузка данных
    loadState();
    
    // Воспроизведение анимаций при загрузке страницы
    setTimeout(playAnimations, 500);
    
    // Проверяем доступ к localStorage
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('LocalStorage доступен');
        
        // Создаем UI для драфта, если есть сохраненное состояние драфта
        const draftState = localStorage.getItem('mlbbDraftState');
        if (draftState) {
            createDraftUI();
            updateDraftState();
        }
    } catch (e) {
        console.error('LocalStorage недоступен:', e);
    }
    
    // Установка интервала для периодического обновления данных
    setInterval(() => {
        loadState();
        updateDraftState();
    }, UPDATE_INTERVAL);
    
    // Обработка сигналов от admin.js и admin-draft.js (через localStorage)
    window.addEventListener('storage', function(e) {
        if (e.key === 'mlbbOverlayState') {
            loadState();
            // Воспроизводим анимации при изменении состояния
            playAnimations();
        } else if (e.key === 'mlbbDraftState') {
            updateDraftState();
        }
    });
    
    // Добавляем обработчик клавиш для ручного перезапуска анимаций (клавиша 'R')
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            console.log('Перезапуск анимаций...');
            playAnimations();
        }
    });
});