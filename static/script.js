document.addEventListener('DOMContentLoaded', function() {
    // Основные элементы
    const menuBtn = document.getElementById('menuBtn');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const addButton = document.getElementById('addButton');
    const phraseInputContainer = document.getElementById('phraseInputContainer');
    const profileInfo = document.querySelector('.profile-info');
    const myTestsContent = document.getElementById('testsContent');
    const sections = document.querySelectorAll('.section');
    const sectionContents = document.querySelectorAll('.section-content');

    // Инициализация - скрываем кнопку "+" по умолчанию
    addButton.classList.add('hidden');

    // ===== Обработка меню =====
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        sectionsContainer.classList.toggle('hidden');

        // Показываем "+" только при открытом меню и в секции "Мои тесты"
        if (sectionsContainer.classList.contains('hidden')) {
            addButton.classList.add('hidden');
        } else {
            const activeSection = document.querySelector('.section.active');
            if (activeSection && activeSection.dataset.section === 'tests') {
                addButton.classList.remove('hidden');
                addButton.textContent = '+';
                addButton.classList.remove('add-mode');
            }
        }
    });

    // ===== Обработка кнопки +/Добавить =====
    addButton.addEventListener('click', function(e) {
        e.stopPropagation();

        if (this.textContent === '+') {
            // Активируем режим добавления
            this.textContent = 'Добавить';
            this.classList.add('add-mode');

            // Скрываем все лишние элементы
            sectionsContainer.classList.add('hidden');
            profileInfo.classList.add('hidden');
            myTestsContent.classList.add('hidden');

            // Показываем поля ввода
            phraseInputContainer.classList.remove('hidden');

            // Прокручиваем к полям ввода
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            // Деактивируем режим добавления
            this.textContent = '+';
            this.classList.remove('add-mode');
            phraseInputContainer.classList.add('hidden');

            // Восстанавливаем скрытые элементы
            profileInfo.classList.remove('hidden');
            myTestsContent.classList.remove('hidden');

            // Кнопка "+" останется скрытой до открытия меню
            this.classList.add('hidden');
        }
    });

    // ===== Переключение между секциями =====
    sections.forEach(section => {
        section.addEventListener('click', function() {
            // Сбрасываем активные состояния
            sections.forEach(s => s.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            // Устанавливаем активное состояние
            this.classList.add('active');
            const sectionId = this.dataset.section + 'Content';
            document.getElementById(sectionId).classList.add('active');

            // Управление кнопкой "+"
            if (this.dataset.section === 'tests') {
                if (!sectionsContainer.classList.contains('hidden')) {
                    addButton.classList.remove('hidden');
                    addButton.textContent = '+';
                    addButton.classList.remove('add-mode');
                }
            } else {
                addButton.classList.add('hidden');
            }

            // Закрываем режим добавления если был активен
            if (!phraseInputContainer.classList.contains('hidden')) {
                addButton.click();
            }
        });
    });

    // ===== Обработчики аватара =====
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatarBtn = document.getElementById('closeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');

    if (avatarBtn && avatarModal) {
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarModal.classList.remove('hidden');
        });

        closeAvatarBtn.addEventListener('click', function() {
            avatarModal.classList.add('hidden');
        });

        document.addEventListener('click', function(e) {
            if (e.target === avatarModal) {
                avatarModal.classList.add('hidden');
            }
        });
    }

    if (avatarInput && avatarPreview) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.size <= 2 * 1024 * 1024) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    avatarPreview.style.backgroundImage = `url(${event.target.result})`;
                    avatarPreview.innerHTML = '';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ===== Обработчики авторизации =====
    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const authTabBtns = document.querySelectorAll('.auth-tab-btn');

    if (authBtn && authModal) {
        authBtn.addEventListener('click', function() {
            authModal.classList.remove('hidden');
        });

        closeAuthBtn.addEventListener('click', function() {
            authModal.classList.add('hidden');
        });

        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                authModal.classList.add('hidden');
            }
        });
    }

    if (authTabBtns.length > 0) {
        authTabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                authTabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
                this.classList.add('active');
                document.getElementById(this.dataset.tab + 'Form').classList.add('active');
            });
        });
    }

    // Закрытие по Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
            if (authModal) authModal.classList.add('hidden');

            if (!phraseInputContainer.classList.contains('hidden')) {
                addButton.click();
            }
        }
    });

    // Активируем первую секцию по умолчанию
    if (sections.length > 0) {
        sections[0].click();
    }
});