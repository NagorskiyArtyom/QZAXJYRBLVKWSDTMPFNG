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
    const chatsBtn = document.getElementById('chatsBtn');
    const friendRequestsBtn = document.getElementById('friendRequestsBtn');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const friendRequestsModal = document.getElementById('friendRequestsModal');
    const addFriendModal = document.getElementById('addFriendModal');
    const closeFriendRequestsBtn = document.getElementById('closeFriendRequestsBtn');
    const closeAddFriendBtn = document.getElementById('closeAddFriendBtn');
    const searchFriendInput = document.getElementById('searchFriendInput');
    const friendRequestsList = document.getElementById('friendRequestsList');
    const searchFriendResults = document.getElementById('searchFriendResults');
    const chatsContainer = document.getElementById('chatsContainer');
    const sendTestModal = document.getElementById('sendTestModal');
    const closeSendTestBtn = document.getElementById('closeSendTestBtn');
    const friendsList = document.getElementById('friendsList');

    let currentCards = [];
    const savedTests = new Map();
    let currentTestToSend = null;
    let currentUserId = null;

    let chatState = {
        isInChat: false,
        currentFriendId: null,
        currentFriendName: null,
        currentFriendAvatar: null
    };

    async function initPage() {
        await loadCurrentUserId();
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

        if (chatsBtn) chatsBtn.addEventListener('click', () => switchToSection('chats'));
        if (friendRequestsBtn) friendRequestsBtn.addEventListener('click', () => {
            toggleModal(friendRequestsModal);
            loadFriendRequests();
        });
        if (addFriendBtn) addFriendBtn.addEventListener('click', () => toggleModal(addFriendModal));
        if (closeFriendRequestsBtn) closeFriendRequestsBtn.addEventListener('click', () => toggleModal(friendRequestsModal));
        if (closeAddFriendBtn) closeAddFriendBtn.addEventListener('click', () => toggleModal(addFriendModal));
        if (searchFriendInput) searchFriendInput.addEventListener('input', searchFriends);
        if (closeSendTestBtn) closeSendTestBtn.addEventListener('click', () => toggleModal(sendTestModal));
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

    function switchToSection(sectionName) {
        sectionContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${sectionName}Content`).classList.add('active');
        sections.forEach(section => section.classList.remove('active'));

        if (sectionName === 'chats') {
            if (chatState.isInChat) {
                openChat(chatState.currentFriendId, chatState.currentFriendName, chatState.currentFriendAvatar);
            } else {
                loadChats();
            }
        }
    }

    async function loadChats() {
        try {
            chatState.isInChat = false;
            const response = await fetch('/get_chats');
            if (!response.ok) throw new Error('Ошибка загрузки чатов');
            const chats = await response.json();

            const chatsContent = document.getElementById('chatsContent');
            chatsContent.innerHTML = `
                <button class="friend-requests-btn" id="friendRequestsBtn">Заявки</button>
                <div class="chats-container" id="chatsContainer"></div>
                <button class="add-friend-btn" id="addFriendBtn">+ Добавить друга</button>
            `;

            renderChats(chats);

            document.getElementById('friendRequestsBtn').addEventListener('click', () => {
                toggleModal(friendRequestsModal);
                loadFriendRequests();
            });
            document.getElementById('addFriendBtn').addEventListener('click', () => toggleModal(addFriendModal));
        } catch (error) {
            console.error('Ошибка загрузки чатов:', error);
            showMessage(chatsContainer, 'Ошибка загрузки чатов');
        }
    }

    function renderChats(chats) {
        const container = document.getElementById('chatsContainer');
        if (!container) return;

        container.innerHTML = '';
        if (chats.length === 0) {
            showMessage(container, 'Чатов пока нет');
            return;
        }

        chats.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.className = 'chat-item';
            chatElement.innerHTML = `
                <div class="chat-avatar" style="${chat.avatar ? `background-image: url('/uploads/${chat.avatar}')` : ''}">
                    ${chat.avatar ? '' : '👤'}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${chat.name}</div>
                    <div class="chat-last-message">${chat.last_message || 'Нет сообщений'}</div>
                </div>
            `;

            chatElement.addEventListener('click', () => {
                openChat(chat.id, chat.name, chat.avatar);
            });

            container.appendChild(chatElement);
        });
    }

    async function openChat(friendId, friendName, friendAvatar) {
        chatState = {
            isInChat: true,
            currentFriendId: friendId,
            currentFriendName: friendName,
            currentFriendAvatar: friendAvatar
        };

        const chatHTML = `
            <div class="chat-header">
                <button class="back-to-chats-btn">← Назад</button>
                <div class="chat-avatar" style="${friendAvatar ? `background-image: url('/uploads/${friendAvatar}')` : ''}">
                    ${friendAvatar ? '' : '👤'}
                </div>
                <div class="chat-title">${friendName}</div>
            </div>
            <div class="messages-container" id="messagesContainer"></div>
        `;

        document.getElementById('chatsContent').innerHTML = chatHTML;

        document.querySelector('.back-to-chats-btn').addEventListener('click', () => {
            chatState.isInChat = false;
            loadChats();
        });

        await loadMessages(friendId);
    }

    async function loadMessages(friendId) {
        try {
            const response = await fetch(`/get_messages?friend_id=${friendId}`);
            if (!response.ok) throw new Error('Ошибка загрузки сообщений');
            const messages = await response.json();
            renderMessages(messages);
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage(document.getElementById('messagesContainer'), 'Ошибка загрузки сообщений');
        }
    }

    function renderMessages(messages) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = '';

        if (messages.length === 0) {
            showMessage(container, 'Сообщений пока нет');
            return;
        }

        messages.forEach(message => {
            const formattedTime = new Date(message.time).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const isSaved = isTestSaved(message.test_creator_id, message.test_name);

            const messageElement = document.createElement('div');
            messageElement.className = `message ${message.is_sender ? 'sent' : 'received'}`;

            messageElement.innerHTML = `
                <div class="test-meta-info">${formattedTime}</div>
                <div class="test-item">
                    <div class="test-avatar" style="${message.sender_avatar ? `background-image: url('/uploads/${message.sender_avatar}')` : ''}">
                        ${message.sender_avatar ? '' : '👤'}
                    </div>
                    <div class="test-info">
                        <div class="test-name">${message.test_name}</div>
                        <div class="test-meta">
                            <span class="test-username">${message.sender_name}</span>
                        </div>
                    </div>
                    <div class="test-actions">
                        <button class="play-test-btn"
                                data-test-name="${message.test_name}"
                                data-creator-id="${message.test_creator_id}">
                            Играть
                        </button>
                        <button class="test-action-btn ${isSaved ? 'delete' : 'save'}"
                                data-test-name="${message.test_name}"
                                data-creator-id="${message.test_creator_id}"
                                title="${isSaved ? 'Удалить из избранного' : 'Сохранить в избранное'}">
                        </button>
                        <button class="send-test-btn"
                                data-test-name="${message.test_name}"
                                data-creator-id="${message.test_creator_id}">
                            Отправить
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(messageElement);
        });

        container.scrollTop = container.scrollHeight;

        container.querySelectorAll('.test-action-btn').forEach(btn => {
            btn.addEventListener('click', handleTestAction);
        });

        container.querySelectorAll('.play-test-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                playTest(this.dataset.creatorId, this.dataset.testName);
            });
        });

        container.querySelectorAll('.send-test-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                currentTestToSend = {
                    testName: this.dataset.testName,
                    creatorId: this.dataset.creatorId
                };
                toggleModal(sendTestModal);
                loadFriendsForSending();
            });
        });
    }

    async function loadCurrentUserId() {
        try {
            const response = await fetch('/get_current_user_id');
            if (response.ok) {
                const data = await response.json();
                currentUserId = data.user_id;
            }
        } catch (error) {
            console.error('Ошибка получения ID пользователя:', error);
        }
    }

    async function handleTestAction() {
        const btn = this;
        const testName = btn.dataset.testName;
        const creatorId = btn.dataset.creatorId;
        const isDelete = btn.classList.contains('delete');
        const testKey = `${creatorId}_${testName}`;

        btn.disabled = true;
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<div class="loader"></div>';

        try {
            const endpoint = isDelete ? '/unsave_test' : '/save_test';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    test_name: testName,
                    creator_id: creatorId
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка сервера');
            }

            if (isDelete) {
                savedTests.delete(testKey);
            } else {
                savedTests.set(testKey, true);
            }

            document.querySelectorAll(`.test-action-btn[data-test-name="${testName}"][data-creator-id="${creatorId}"]`).forEach(button => {
                button.classList.toggle('delete', !isDelete);
                button.classList.toggle('save', isDelete);
                button.title = isDelete ? 'Сохранить в избранное' : 'Удалить из избранного';
                button.innerHTML = '';
            });

            if (document.getElementById('favoritesContent').classList.contains('active')) {
                await loadSavedTests();
            }

        } catch (error) {
            console.error('Ошибка:', error);
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    async function loadSavedTests() {
        const container = userFavoritesContainer;
        if (!container) return;

        try {
            container.innerHTML = '<div class="loading">Загрузка избранного...</div>';

            const response = await fetch('/get_saved_tests');
            if (!response.ok) throw new Error('Ошибка загрузки избранного');

            const tests = await response.json();

            savedTests.clear();
            tests.forEach(test => {
                const key = `${test.creator_id}_${test.test_name}`;
                savedTests.set(key, true);
            });

            if (tests.length === 0) {
                container.innerHTML = '<p class="empty-message">Нет избранных тестов</p>';
            } else {
                renderTests(tests, container);
            }

        } catch (error) {
            console.error('Ошибка загрузки избранного:', error);
            container.innerHTML = `<p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }

    function isTestSaved(creatorId, testName) {
        return savedTests.has(`${creatorId}_${testName}`);
    }

    function renderTests(tests, container) {
        if (!container) return;
        container.innerHTML = '';

        if (tests.length === 0) {
            showMessage(container, 'Тесты не найдены');
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
                <div class="test-actions">
                    <button class="play-test-btn"
                            data-test-name="${test.test_name}"
                            data-creator-id="${test.creator_id || test.user_id}">
                        Играть
                    </button>
                    <button class="test-action-btn ${isSaved ? 'delete' : 'save'}"
                            data-test-name="${test.test_name}"
                            data-creator-id="${test.creator_id || test.user_id}"
                            title="${isSaved ? 'Удалить из избранного' : 'Сохранить в избранное'}">
                    </button>
                    <button class="send-test-btn"
                            data-test-name="${test.test_name}"
                            data-creator-id="${test.creator_id || test.user_id}">
                        Отправить
                    </button>
                </div>
            `;
            container.appendChild(testElement);
        });

        container.querySelectorAll('.test-action-btn').forEach(btn => {
            btn.addEventListener('click', handleTestAction);
        });

        container.querySelectorAll('.play-test-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                playTest(this.dataset.creatorId, this.dataset.testName);
            });
        });

        container.querySelectorAll('.send-test-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                currentTestToSend = {
                    testName: this.dataset.testName,
                    creatorId: this.dataset.creatorId
                };
                toggleModal(sendTestModal);
                loadFriendsForSending();
            });
        });
    }

    async function loadFriendRequests() {
        try {
            const response = await fetch('/get_friend_requests');
            if (!response.ok) throw new Error('Ошибка загрузки заявок');
            const requests = await response.json();
            renderFriendRequests(requests);
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            showMessage(friendRequestsList, 'Ошибка загрузки заявок');
        }
    }

    function renderFriendRequests(requests) {
        friendRequestsList.innerHTML = '';
        if (requests.length === 0) {
            showMessage(friendRequestsList, 'Заявок пока нет');
            return;
        }

        requests.forEach(request => {
            const requestElement = document.createElement('div');
            requestElement.className = 'friend-request-item';
            requestElement.innerHTML = `
                <div class="chat-avatar" style="${request.avatar ? `background-image: url('/uploads/${request.avatar}')` : ''}">
                    ${request.avatar ? '' : '👤'}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${request.name}</div>
                </div>
                <button class="request-action-btn"
                        data-request-id="${request.request_id}"
                        data-sender-id="${request.sender_id}">
                    Добавить в друзья
                </button>
            `;
            friendRequestsList.appendChild(requestElement);
        });

        document.querySelectorAll('.request-action-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const button = this;
                const requestId = button.dataset.requestId;
                const senderId = button.dataset.senderId;

                button.disabled = true;
                button.textContent = 'Обработка...';

                try {
                    const response = await fetch('/accept_friend_request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            request_id: requestId,
                            sender_id: senderId
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Ошибка сервера');
                    }

                    await loadFriendRequests();
                    await loadChats();

                } catch (error) {
                    console.error('Ошибка:', error);
                    alert(error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = 'Добавить в друзья';
                }
            });
        });
    }

    async function searchFriends() {
        const searchTerm = searchFriendInput.value.trim();
        if (searchTerm.length < 2) {
            searchFriendResults.innerHTML = '';
            return;
        }

        try {
            const response = await fetch(`/search_friends?q=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Ошибка поиска');
            const results = await response.json();
            renderSearchResults(results);
        } catch (error) {
            console.error('Ошибка поиска:', error);
            showMessage(searchFriendResults, 'Ошибка поиска');
        }
    }

    function renderSearchResults(results) {
        searchFriendResults.innerHTML = '';
        if (results.length === 0) {
            showMessage(searchFriendResults, 'Ничего не найдено');
            return;
        }

        results.forEach(result => {
            const resultElement = document.createElement('div');
            resultElement.className = 'friend-search-result';
            resultElement.innerHTML = `
                <div class="chat-avatar" style="${result.avatar ? `background-image: url('/uploads/${result.avatar}')` : ''}">
                    ${result.avatar ? '' : '👤'}
                </div>
                <div class="chat-info">
                    <div class="chat-name">${result.name}</div>
                </div>
                <button class="send-request-btn" data-user-id="${result.id}">
                    Отправить заявку
                </button>
            `;
            searchFriendResults.appendChild(resultElement);
        });

        document.querySelectorAll('.send-request-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const button = this;
                const userId = button.dataset.userId;

                button.disabled = true;
                button.textContent = 'Отправка...';

                try {
                    const response = await fetch('/send_friend_request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: userId })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Ошибка сервера');
                    }

                    alert('Заявка отправлена!');
                    toggleModal(addFriendModal);

                } catch (error) {
                    console.error('Ошибка:', error);
                    alert(error.message);
                } finally {
                    button.disabled = false;
                    button.textContent = 'Отправить заявку';
                }
            });
        });
    }

    async function loadFriendsForSending() {
        try {
            const response = await fetch('/get_friends');
            if (!response.ok) throw new Error('Ошибка загрузки друзей');
            const friends = await response.json();
            renderFriendsForSending(friends);
        } catch (error) {
            console.error('Ошибка:', error);
            showMessage(friendsList, 'Ошибка загрузки друзей');
        }
    }

    function renderFriendsForSending(friends) {
        friendsList.innerHTML = '';

        if (friends.length === 0) {
            showMessage(friendsList, 'У вас пока нет друзей');
            return;
        }

        friends.forEach(friend => {
            const friendElement = document.createElement('div');
            friendElement.className = 'friend-item';
            friendElement.innerHTML = `
                <div class="friend-avatar" style="${friend.avatar ? `background-image: url('/uploads/${friend.avatar}')` : ''}">
                    ${friend.avatar ? '' : '👤'}
                </div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                </div>
                <button class="send-to-friend-btn" data-friend-id="${friend.id}">
                    Отправить
                </button>
            `;
            friendsList.appendChild(friendElement);
        });

        document.querySelectorAll('.send-to-friend-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const friendId = this.dataset.friendId;
                try {
                    const response = await fetch('/send_message', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            receiver_id: friendId,
                            test_name: currentTestToSend.testName,
                            test_creator_id: currentTestToSend.creatorId
                        })
                    });

                    if (!response.ok) throw new Error('Ошибка отправки');

                    if (chatState.isInChat && chatState.currentFriendId === friendId) {
                        await loadMessages(friendId);
                    }

                    alert('Тест отправлен!');
                    toggleModal(sendTestModal);
                } catch (error) {
                    console.error('Ошибка:', error);
                    alert(error.message);
                }
            });
        });
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
        } else if (sectionId === 'chatsContent') {
            if (chatState.isInChat) {
                openChat(chatState.currentFriendId, chatState.currentFriendName, chatState.currentFriendAvatar);
            } else {
                loadChats();
            }
        }
    }

    function toggleModal(modal) {
        if (modal) modal.classList.toggle('hidden');
    }

    function handleOutsideClick(e) {
        if (e.target === avatarModal) toggleModal(avatarModal);
        if (e.target === authModal) toggleModal(authModal);
        if (e.target === friendRequestsModal) toggleModal(friendRequestsModal);
        if (e.target === addFriendModal) toggleModal(addFriendModal);
        if (e.target === sendTestModal) toggleModal(sendTestModal);
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

    async function loadAllTests(container) {
        if (!container) return;
        try {
            const response = await fetch('/get_all_tests');
            if (!response.ok) throw new Error('Ошибка загрузки');
            const tests = await response.json();
            renderTests(tests, container);
        } catch (error) {
            console.error('Ошибка загрузки тестов:', error);
            showMessage(container, 'Ошибка загрузки');
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
            showMessage(userTestsContainer, 'Ошибка загрузки');
        }
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
                showMessage(container, 'Ничего не найдено');
            }
        });
    }

    function showMessage(container, message) {
        container.innerHTML = `<p style="text-align: center; color: #666;">${message}</p>`;
    }

    async function playTest(creatorId, testName) {
        try {
            const gameUrl = `/play_test/${creatorId}/${encodeURIComponent(testName)}`;
            window.open(gameUrl, '_blank');
        } catch (error) {
            console.error('Ошибка загрузки теста:', error);
            alert('Ошибка загрузки теста');
        }
    }

    initPage();
});