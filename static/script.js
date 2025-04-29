document.addEventListener('DOMContentLoaded', function() {
    // Обработчики для меню
    const menuBtn = document.getElementById('menuBtn');
    const sectionsContainer = document.getElementById('sectionsContainer');

    if (menuBtn && sectionsContainer) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sectionsContainer.classList.toggle('hidden');
        });

        // Закрытие меню при клике вне его области
        document.addEventListener('click', function(e) {
            if (!sectionsContainer.contains(e.target) && e.target !== menuBtn) {
                sectionsContainer.classList.add('hidden');
            }
        });
    }

    // Обработчики для аватара
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatarBtn = document.getElementById('closeAvatarBtn');

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

    // Обработчики для авторизации
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        const authModal = document.getElementById('authModal');
        const closeAuthBtn = document.getElementById('closeAuthBtn');

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

        // Переключение вкладок авторизации
        document.querySelectorAll('.auth-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.auth-tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));

                this.classList.add('active');
                document.getElementById(this.dataset.tab + 'Form').classList.add('active');
            });
        });
    }

    // Переключение между секциями
    const sections = document.querySelectorAll('.section');
    if (sections.length > 0) {
        sections.forEach(section => {
            section.addEventListener('click', function() {
                // Удаляем активный класс у всех секций
                document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                document.querySelectorAll('.section-content').forEach(c => c.classList.remove('active'));

                // Добавляем активный класс текущей секции
                this.classList.add('active');

                // Показываем соответствующий контент
                const sectionId = this.dataset.section + 'Content';
                document.getElementById(sectionId).classList.add('active');
            });
        });
    }

    // Закрытие модальных окон при нажатии Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
            });
            document.getElementById('authModal')?.classList.add('hidden');
        }
    });
});