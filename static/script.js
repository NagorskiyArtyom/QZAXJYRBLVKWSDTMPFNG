document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const sections = document.querySelectorAll('.section');
    const sectionContents = document.querySelectorAll('.section-content');
    const homeBtn = document.querySelector('.home-btn');
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatarBtn = document.getElementById('closeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const authTabBtns = document.querySelectorAll('.auth-tab-btn');
    const addTestBtn = document.getElementById('addTestBtn');
    const addTestContainer = document.getElementById('addTestContainer');
    const testNameInput = document.getElementById('testName');
    const cardsPreview = document.getElementById('cardsPreview');
    const cancelTestBtn = document.querySelector('.cancel-test-btn');
    const createTestBtn = document.querySelector('.create-test-btn');
    const addCardBtn = document.querySelector('.add-card-btn');
    const cardFrontInput = document.querySelector('.card-front-input');
    const cardBackInput = document.querySelector('.card-back-input');
    const userTestsContainer = document.getElementById('userTestsContainer');
    const userAllTestsContainer = document.getElementById('userAllTestsContainer');
    const guestTestsContainer = document.getElementById('guestTestsContainer');
    const userFavoritesContainer = document.getElementById('userFavoritesContainer');
    const testNameError = document.getElementById('testNameError');
    const searchBar = document.querySelector('.search-bar');

    let currentCards = [];
    const savedTests = new Map();

    async function initPage() {
        await loadSavedTests();
        const testsContainer = userAllTestsContainer || guestTestsContainer;
        if (testsContainer) loadAllTests(testsContainer);
        if (userTestsContainer) loadUserTests();
        setupEventListeners();
    }

    function setupEventListeners() {
        if (homeBtn) homeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showMainContent();
        });
        if (menuBtn) menuBtn.addEventListener('click', toggleMenu);
        sections.forEach(section => section.addEventListener('click', switchSection));
        if (avatarBtn) avatarBtn.addEventListener('click', () => toggleModal(avatarModal));
        if (closeAvatarBtn) closeAvatarBtn.addEventListener('click', () => toggleModal(avatarModal));
        if (authBtn) authBtn.addEventListener('click', () => toggleModal(authModal));
        if (closeAuthBtn) closeAuthBtn.addEventListener('click', () => toggleModal(authModal));
        if (avatarInput) avatarInput.addEventListener('change', handleAvatarUpload);
        authTabBtns.forEach(btn => btn.addEventListener('click', switchAuthTab));
        if (addTestBtn) addTestBtn.addEventListener('click', showTestForm);
        if (cancelTestBtn) cancelTestBtn.addEventListener('click', resetTestForm);
        if (addCardBtn) addCardBtn.addEventListener('click', addCardToTest);
        if (createTestBtn) createTestBtn.addEventListener('click', createTest);
        if (searchBar) searchBar.addEventListener('input', filterTests);
        document.addEventListener('click', handleOutsideClick);
        document.addEventListener('keydown', handleEscapeKey);
    }

    async function loadSavedTests() {
        try {
            const response = await fetch('/get_saved_tests');
            if (!response.ok) throw new Error('Ошибка загрузки избранного');
            const tests = await response.json();

            savedTests.clear();
            tests.forEach(test => {
                const key = `${test.creator_id}_${test.test_name}`;
                savedTests.set(key, true);
            });

            if (userFavoritesContainer && document.getElementById('favoritesContent').classList.contains('active')) {
                renderTests(tests, userFavoritesContainer);
            }
        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
        }
    }

    function isTestSaved(creatorId, testName) {
        return savedTests.has(`${creatorId}_${testName}`);
    }

    function renderTests(tests, container) {
        if (!container) return;
        container.innerHTML = '';

        if (tests.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666;">Тесты не найдены</p>';
            return;
        }

        tests.forEach(test => {
            const isSaved = isTestSaved(test.creator_id || test.user_id, test.test_name);
            const testElement = document.createElement('div');
            testElement.className = 'test-item';
            testElement.innerHTML = `
                <div class="test-avatar" style="${test.avatar ? `background-image: url('/uploads/${test.avatar}')` : ''}">
                    ${test.avatar ? '' : '👤'}
                </div>
                <div class="test-info">
                    <div class="test-name">${test.test_name}</div>
                    <div class="test-meta">
                        <span class="test-username">${test.username}</span>
                        <span class="test-cards-count">${test.cards_count}</span>
                    </div>
                </div>
                <button class="test-action-btn ${isSaved ? 'delete' : 'save'}"
                        data-test-name="${test.test_name}"
                        data-creator-id="${test.creator_id || test.user_id}"
                        title="${isSaved ? 'Удалить из избранного' : 'Сохранить в избранное'}">
                </button>
            `;
            container.appendChild(testElement);
        });

        container.querySelectorAll('.test-action-btn').forEach(btn => {
            btn.addEventListener('click', handleTestAction);
        });
    }

    async function handleTestAction() {
        const testName = this.dataset.testName;
        const creatorId = this.dataset.creatorId;
        const isDelete = this.classList.contains('delete');
        const testKey = `${creatorId}_${testName}`;
        const testItem = this.closest('.test-item');

        testItem.classList.add('updating');

        try {
            const endpoint = isDelete ? '/unsave_test' : '/save_test';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test_name: testName, creator_id: creatorId })
            });

            if (!response.ok) throw new Error('Ошибка сервера');

            if (isDelete) {
                savedTests.delete(testKey);
            } else {
                savedTests.set(testKey, true);
            }

            updateAllVisibleLists(testKey, isDelete);

        } catch (error) {
            console.error('Ошибка:', error);
        } finally {
            testItem.classList.remove('updating');
        }
    }

    function updateAllVisibleLists(testKey, wasDeleted) {
        const [creatorId, testName] = testKey.split('_');

        const updateContainerButtons = (container) => {
            if (!container) return;
            const buttons = container.querySelectorAll(
                `[data-test-name="${testName}"][data-creator-id="${creatorId}"]`
            );

            buttons.forEach(btn => {
                btn.classList.toggle('delete', !wasDeleted);
                btn.classList.toggle('save', wasDeleted);
                btn.title = wasDeleted ? 'Сохранить в избранное' : 'Удалить из избранного';
            });
        };

        updateContainerButtons(userAllTestsContainer);
        updateContainerButtons(userTestsContainer);

        if (wasDeleted && userFavoritesContainer &&
            document.getElementById('favoritesContent').classList.contains('active')) {
            const itemToRemove = userFavoritesContainer.querySelector(
                `[data-test-name="${testName}"][data-creator-id="${creatorId}"]`
            )?.closest('.test-item');

            if (itemToRemove) itemToRemove.remove();

            if (userFavoritesContainer.children.length === 0) {
                userFavoritesContainer.innerHTML = '<p style="text-align: center; color: #666;">Тесты не найдены</p>';
            }
        }
    }

    async function loadAllTests(container) {
        if (!container) return;
        try {
            const response = await fetch('/get_all_tests');
            if (!response.ok) throw new Error('Ошибка загрузки');
            const tests = await response.json();
            renderTests(tests, container);
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            container.innerHTML = '<p style="text-align: center; color: #666;">Ошибка загрузки</p>';
        }
    }

    async function loadUserTests() {
        if (!userTestsContainer) return;
        try {
            const response = await fetch('/get_tests');
            if (!response.ok) throw new Error('Ошибка загрузки');
            const tests = await response.json();
            renderTests(tests, userTestsContainer);
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            userTestsContainer.innerHTML = '<p style="text-align: center; color: #666;">Ошибка загрузки</p>';
        }
    }

    function showMainContent() {
        sectionContents.forEach(content => content.classList.remove('active'));
        const mainContent = document.getElementById('mainContent');
        if (mainContent) mainContent.classList.add('active');
        sections.forEach(section => section.classList.remove('active'));
    }

    function toggleMenu(e) {
        e.stopPropagation();
        sectionsContainer.classList.toggle('hidden');
    }

    function switchSection() {
        sectionContents.forEach(content => content.classList.remove('active'));
        const sectionId = this.dataset.section + 'Content';
        const sectionContent = document.getElementById(sectionId);
        if (sectionContent) sectionContent.classList.add('active');
        sections.forEach(section => section.classList.remove('active'));
        this.classList.add('active');

        if (sectionId === 'favoritesContent') {
            loadSavedTests();
        } else if (sectionId === 'testsContent') {
            loadUserTests();
        } else if (sectionId === 'mainContent') {
            const container = userAllTestsContainer || guestTestsContainer;
            if (container) loadAllTests(container);
        }
    }

    function toggleModal(modal) {
        if (modal) modal.classList.toggle('hidden');
    }

    function handleOutsideClick(e) {
        if (e.target === avatarModal) toggleModal(avatarModal);
        if (e.target === authModal) toggleModal(authModal);
    }

    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        }
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (file && file.size <= 2 * 1024 * 1024) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatarPreview.style.backgroundImage = `url(${event.target.result})`;
                avatarPreview.innerHTML = '';
            };
            reader.readAsDataURL(file);
        }
    }

    function switchAuthTab() {
        authTabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
        this.classList.add('active');
        const tabForm = document.getElementById(this.dataset.tab + 'Form');
        if (tabForm) tabForm.classList.add('active');
    }

    function showTestForm() {
        addTestBtn.classList.add('hidden');
        addTestContainer.classList.remove('hidden');
        testNameInput.focus();
    }

    function addCardToTest() {
        const frontText = cardFrontInput.value.trim();
        const backText = cardBackInput.value.trim();
        if (!frontText || !backText) return;
        currentCards.push({ front_text: frontText, back_text: backText });
        updateCardsPreview();
        cardFrontInput.value = '';
        cardBackInput.value = '';
        cardFrontInput.focus();
    }

    function updateCardsPreview() {
        cardsPreview.innerHTML = '';
        currentCards.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card-preview-item';
            cardElement.innerHTML = `
                <div class="card-preview-text">
                    <div class="card-preview-front">${card.front_text}</div>
                    <div class="card-preview-back">${card.back_text}</div>
                </div>
                <button class="delete-preview-card" data-index="${index}">×</button>
            `;
            cardsPreview.appendChild(cardElement);
        });
        document.querySelectorAll('.delete-preview-card').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                currentCards.splice(index, 1);
                updateCardsPreview();
            });
        });
    }

    async function createTest() {
        const testName = testNameInput.value.trim();
        if (!testName) {
            showError('Пожалуйста, введите название теста');
            return;
        }
        if (currentCards.length === 0) {
            showError('Добавьте хотя бы одну фразу');
            return;
        }
        hideError();

        try {
            const savePromises = currentCards.map(card =>
                saveCardToServer({
                    test_name: testName,
                    front_text: card.front_text,
                    back_text: card.back_text
                })
            );

            await Promise.all(savePromises);
            resetTestForm();

            if (userTestsContainer) loadUserTests();
            if (userAllTestsContainer) loadAllTests(userAllTestsContainer);
            if (guestTestsContainer) loadAllTests(guestTestsContainer);

        } catch (error) {
            if (error.error === 'У вас уже есть тест с таким названием') {
                showError('У вас уже есть тест с таким названием');
            } else {
                showError('Ошибка при сохранении теста');
            }
        }
    }

    async function saveCardToServer(cardData) {
        const response = await fetch('/add_card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardData)
        });
        if (!response.ok) {
            const error = await response.json();
            return Promise.reject(error);
        }
        return response.json();
    }

    function showError(message) {
        if (!testNameError) return;
        testNameError.textContent = message;
        testNameError.style.display = 'block';
    }

    function hideError() {
        if (!testNameError) return;
        testNameError.style.display = 'none';
    }

    function resetTestForm() {
        currentCards = [];
        if (testNameInput) testNameInput.value = '';
        if (cardFrontInput) cardFrontInput.value = '';
        if (cardBackInput) cardBackInput.value = '';
        if (cardsPreview) cardsPreview.innerHTML = '';
        hideError();
        if (addTestContainer) addTestContainer.classList.add('hidden');
        if (addTestBtn) addTestBtn.classList.remove('hidden');
    }

    function filterTests(e) {
        const searchTerm = e.target.value.toLowerCase();
        const containers = [userAllTestsContainer, userTestsContainer, userFavoritesContainer, guestTestsContainer];

        containers.forEach(container => {
            if (!container) return;
            const items = container.querySelectorAll('.test-item');
            let hasResults = false;

            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                const isVisible = text.includes(searchTerm);
                item.style.display = isVisible ? 'flex' : 'none';
                if (isVisible) hasResults = true;
            });

            if (!hasResults && container.children.length > 0) {
                const noResults = document.createElement('p');
                noResults.style.textAlign = 'center';
                noResults.style.color = '#666';
                noResults.textContent = 'Ничего не найдено';
                container.appendChild(noResults);
            }
        });
    }

    initPage();
});