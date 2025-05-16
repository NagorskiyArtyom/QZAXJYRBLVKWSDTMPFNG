document.addEventListener('DOMContentLoaded', () => {
  // Элементы страницы (из обоих файлов)
  const homeBtn = document.querySelector('.home-btn');
  const menuBtn = document.getElementById('menuBtn');
  const sections = document.querySelectorAll('.section');
  const sectionContents = document.querySelectorAll('.section-content');
  const searchBar = document.querySelector('.search-bar');
  const sectionsContainer = document.getElementById('sectionsContainer');

  // Модалки
  const authBtn = document.getElementById('authBtn');
  const authModal = document.getElementById('authModal');
  const closeAuthBtn = document.getElementById('closeAuthBtn');
  const authTabBtns = document.querySelectorAll('.auth-tab-btn');
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarBtn = document.getElementById('closeAvatarBtn');
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');

  // Форма создания тестов
  const addTestBtn = document.getElementById('addTestBtn');
  const addTestContainer = document.getElementById('addTestContainer');
  const testNameInput = document.getElementById('testName');
  const cancelTestBtn = document.querySelector('.cancel-test-btn');
  const createTestBtn = document.querySelector('.create-test-btn');
  const addCardBtn = document.querySelector('.add-card-btn');
  const cardFrontInput = document.querySelector('.card-front-input');
  const cardBackInput = document.querySelector('.card-back-input');
  const cardsPreview = document.getElementById('cardsPreview');
  const testNameError = document.getElementById('testNameError');

  // Контейнеры списков тестов
  const userAllTestsContainer = document.getElementById('userAllTestsContainer');
  const userTestsContainer = document.getElementById('userTestsContainer');
  const userFavoritesContainer = document.getElementById('userFavoritesContainer');
  const guestTestsContainer = document.getElementById('guestTestsContainer');
  const userHistoryContainer = document.getElementById('userHistoryContainer');

  // Новые элементы из второго файла
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

  // Состояние чата из второго файла
  let chatState = {
    isInChat: false,
    currentFriendId: null,
    currentFriendName: null,
    currentFriendAvatar: null
  };

  // Простейшие вспомогательные функции
  function toggleModal(modal) {
    if (modal) modal.classList.toggle('hidden');
  }

  function showError(msg) {
    if (testNameError) {
      testNameError.textContent = msg;
      testNameError.style.display = 'block';
    }
  }

  function hideError() {
    if (testNameError) testNameError.style.display = 'none';
  }

  function showMessage(container, message) {
    if (container) {
      container.innerHTML = `<p style="text-align: center; color: #666;">${message}</p>`;
    }
  }

  // Обработчики Auth-модалки
  authBtn?.addEventListener('click', e => {
    e.stopPropagation();
    toggleModal(authModal);
    authTabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('.auth-tab-btn[data-tab="login"]')?.classList.add('active');
    document.getElementById('loginForm')?.classList.add('active');
  });

  closeAuthBtn?.addEventListener('click', e => {
    e.stopPropagation();
    authModal.classList.add('hidden');
  });

  authModal?.querySelector('.auth-modal-content')?.addEventListener('click', e => e.stopPropagation());

  authTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      authTabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Form')?.classList.add('active');
      document.getElementById('registerEmailError')?.style.setProperty('display','none','important');
      document.getElementById('registerPasswordError')?.style.setProperty('display','none','important');
    });
  });

  // Обработчики Avatar-модалки
  avatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    toggleModal(avatarModal);
  });

  closeAvatarBtn?.addEventListener('click', e => {
    e.stopPropagation();
    avatarModal.classList.add('hidden');
  });

  avatarModal?.querySelector('.avatar-modal')?.addEventListener('click', e => e.stopPropagation());

  avatarInput?.addEventListener('change', handleAvatarUpload);

  function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = function(event) {
        if (avatarPreview) {
          avatarPreview.style.backgroundImage = `url(${event.target.result})`;
          avatarPreview.innerHTML = '';
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Валидация формы регистрации
  const registerForm = document.getElementById('registerFormElement');
  if (registerForm) {
    const emailInput = document.getElementById('registerEmail');
    const passInput = document.getElementById('registerPassword');
    const emailError = document.getElementById('registerEmailError');
    const passError = document.getElementById('registerPasswordError');

    registerForm.addEventListener('submit', e => {
      let valid = true;
      emailError.style.display = 'none';
      passError.style.display = 'none';
      if (!emailInput.value.includes('@')) {
        emailError.textContent = 'Введите корректный email.';
        emailError.style.display = 'block';
        valid = false;
      }
      if (passInput.value.length < 6) {
        passError.textContent = 'Пароль минимум 6 символов.';
        passError.style.display = 'block';
        valid = false;
      }
      if (!valid) e.preventDefault();
    });
  }

  // Новые обработчики для чатов и друзей
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

  // Запуск первоначальной загрузки
  initPage();

  async function initPage() {
    await loadCurrentUserId();
    await loadSavedTests();
    const initial = userAllTestsContainer || guestTestsContainer;
    if (initial) await loadAllTests(initial);
    if (userTestsContainer) await loadUserTests();
    bindUIActions();
  }

  // Загрузка ID текущего пользователя
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

  function bindUIActions() {
    homeBtn?.addEventListener('click', e => { e.preventDefault(); showSection('mainContent'); });
    menuBtn?.addEventListener('click', toggleMenu);
    sections.forEach(sec => sec.addEventListener('click', () => showSection(sec.dataset.section + 'Content')));

    addTestBtn?.addEventListener('click', showForm);
    cancelTestBtn?.addEventListener('click', resetForm);
    addCardBtn?.addEventListener('click', addCard);
    createTestBtn?.addEventListener('click', createTest);

    searchBar?.addEventListener('input', filterTests);

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);
  }

  function toggleMenu(e) {
    e.stopPropagation();
    if (sectionsContainer) sectionsContainer.classList.toggle('hidden');
  }

  function handleOutsideClick(e) {
    if (e.target === avatarModal) toggleModal(avatarModal);
    if (e.target === authModal) toggleModal(authModal);
    if (friendRequestsModal && e.target === friendRequestsModal) toggleModal(friendRequestsModal);
    if (addFriendModal && e.target === addFriendModal) toggleModal(addFriendModal);
    if (sendTestModal && e.target === sendTestModal) toggleModal(sendTestModal);
  }

  function handleEscapeKey(e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    }
  }

  // Переключение разделов
  function showSection(id) {
    sectionContents.forEach(c => c.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    sections.forEach(s => s.classList.remove('active'));
    document.querySelector(`.section[data-section="${id.replace('Content','')}"]`)?.classList.add('active');

    if (id === 'testsContent') {
      resetForm();
      loadUserTests();
    } else if (id === 'favoritesContent') {
      loadFavorites();
    } else if (id === 'historyContent') {
      loadHistory();
    } else if (id === 'mainContent') {
      loadAllTests(userAllTestsContainer || guestTestsContainer);
    } else if (id === 'chatsContent') {
      if (chatState.isInChat) {
        openChat(chatState.currentFriendId, chatState.currentFriendName, chatState.currentFriendAvatar);
      } else {
        loadChats();
      }
    }
  }

  function switchToSection(sectionName) {
    showSection(sectionName + 'Content');
  }

  // Загрузка IDs избранного
  async function loadSavedTests() {
    try {
      const res = await fetch('/get_saved_tests');
      if (!res.ok) throw new Error();
      const arr = await res.json();
      savedTests.clear();
      arr.forEach(t => savedTests.set(`${t.creator_id}_${t.test_name}`, true));
    } catch (e) {
      console.error('Ошибка загрузки избранного:', e);
    }
  }

  // Рендер списка тестов
  function renderTests(tests, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!tests.length) {
      showMessage(container, 'Тесты не найдены');
      return;
    }

    tests.forEach(test => {
      const isFav = savedTests.has(`${test.creator_id}_${test.test_name}`);
      const div = document.createElement('div');
      div.className = 'test-item';
      div.innerHTML = `
        <div class="test-avatar" style="${test.avatar?`background-image:url('/uploads/${test.avatar}')`:''}"></div>
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
                  data-creator-id="${test.creator_id}">
            Играть
          </button>
          <button class="test-action-btn ${isFav?'delete':'save'}"
                  data-test-name="${test.test_name}"
                  data-creator-id="${test.creator_id}"></button>
          <button class="send-test-btn"
                  data-test-name="${test.test_name}"
                  data-creator-id="${test.creator_id}">
            Отправить
          </button>
        </div>
      `;

      div.querySelector('.test-action-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        handleTestAction(e.currentTarget);
      });

      div.querySelector('.play-test-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        playTest(e.currentTarget.dataset.creatorId, e.currentTarget.dataset.testName);
      });

      div.querySelector('.send-test-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        currentTestToSend = {
          testName: e.currentTarget.dataset.testName,
          creatorId: e.currentTarget.dataset.creatorId
        };
        toggleModal(sendTestModal);
        loadFriendsForSending();
      });

      div.addEventListener('click', () => recordHistory(test));
      container.appendChild(div);
    });
  }

  // Загрузить разные списки тестов
  async function loadAllTests(container) {
    if (!container) return;
    try {
      const res = await fetch('/get_all_tests');
      if (!res.ok) throw new Error();
      renderTests(await res.json(), container);
    } catch {
      showMessage(container, 'Ошибка загрузки');
    }
  }

  async function loadUserTests() {
    if (!userTestsContainer) return;
    try {
      const res = await fetch('/get_tests');
      if (!res.ok) throw new Error();
      renderTests(await res.json(), userTestsContainer);
    } catch {
      showMessage(userTestsContainer, 'Ошибка загрузки');
    }
  }

  async function loadFavorites() {
    if (!userFavoritesContainer) return;
    try {
      const res = await fetch('/get_saved_tests');
      if (!res.ok) throw new Error();
      renderTests(await res.json(), userFavoritesContainer);
    } catch {
      showMessage(userFavoritesContainer, 'Ошибка загрузки');
    }
  }

  // Переключение избранного
  async function handleTestAction(btn) {
    const name = btn.dataset.testName;
    const creator = btn.dataset.creatorId;
    const isDel = btn.classList.contains('delete');
    const testKey = `${creator}_${name}`;

    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<div class="loader"></div>';

    try {
      const res = await fetch(isDel?'/unsave_test':'/save_test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({creator_id: creator, test_name: name})
      });

      if (!res.ok) throw new Error();

      if (isDel) savedTests.delete(testKey);
      else savedTests.set(testKey, true);

      document.querySelectorAll(`.test-action-btn[data-test-name="${name}"][data-creator-id="${creator}"]`)
        .forEach(b => {
          b.classList.toggle('delete', !isDel);
          b.classList.toggle('save', isDel);
        });

      if (document.getElementById('favoritesContent')?.classList.contains('active')) {
        await loadFavorites();
      }
    } catch (e) {
      console.error('Ошибка сохранения избранного:', e);
      alert('Ошибка при сохранении теста');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }

  // История (из первого файла)
  function recordHistory(test) {
    const key = 'testHistory';
    let hist = JSON.parse(localStorage.getItem(key) || '[]');
    hist = hist.filter(i => !(i.creator_id === test.creator_id && i.test_name === test.test_name));
    hist.unshift(test);
    if (hist.length > 20) hist.pop();
    localStorage.setItem(key, JSON.stringify(hist));
  }

  function loadHistory() {
    const hist = JSON.parse(localStorage.getItem('testHistory') || '[]');
    userHistoryContainer.innerHTML = '';
    if (!hist.length) {
      showMessage(userHistoryContainer, 'История пуста');
      return;
    }
    hist.forEach(test => {
      const div = document.createElement('div');
      div.className = 'test-item';
      div.innerHTML = `
        <div class="test-avatar" style="${test.avatar?`background-image:url('/uploads/${test.avatar}')`:''}"></div>
        <div class="test-info">
          <div class="test-name">${test.test_name}</div>
          <div class="test-meta">
            <span class="test-username">${test.username}</span>
            <span class="test-cards-count">${test.cards_count}</span>
          </div>
        </div>
      `;
      div.addEventListener('click', () => recordHistory(test));
      userHistoryContainer.appendChild(div);
    });
  }

  // Форма создания теста
  function showForm() {
    addTestBtn?.classList.add('hidden');
    userTestsContainer && (userTestsContainer.style.display = 'none');
    addTestContainer?.classList.remove('hidden');
    testNameInput?.focus();
  }

  function resetForm() {
    currentCards = [];
    testNameInput && (testNameInput.value = '');
    cardFrontInput && (cardFrontInput.value = '');
    cardBackInput && (cardBackInput.value = '');
    cardsPreview && (cardsPreview.innerHTML = '');
    hideError();
    addTestContainer?.classList.add('hidden');
    addTestBtn?.classList.remove('hidden');
    userTestsContainer && (userTestsContainer.style.display = 'flex');
  }

  // Создать тест
  async function createTest() {
    const name = testNameInput?.value.trim();
    if (!name) { showError('Введите название теста'); return; }
    if (!currentCards.length) { showError('Добавьте хотя бы одну фразу'); return; }
    hideError();

    try {
      for (const c of currentCards) {
        const res = await fetch('/add_card', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            test_name: name,
            front_text: c.front_text,
            back_text: c.back_text
          })
        });
        if (!res.ok) throw await res.json();
      }
      resetForm();
      await loadUserTests();
      await loadAllTests(userAllTestsContainer || guestTestsContainer);
    } catch (err) {
      showError(err.error || 'Ошибка при сохранении теста');
    }
  }

  // Добавление карточки
  function addCard() {
    const f = cardFrontInput?.value.trim();
    const b = cardBackInput?.value.trim();
    if (!f || !b) return;
    currentCards.push({ front_text: f, back_text: b });
    updateCardsPreview();
    cardFrontInput && (cardFrontInput.value = '');
    cardBackInput && (cardBackInput.value = '');
    cardFrontInput?.focus();
  }

  function updateCardsPreview() {
    if (!cardsPreview) return;
    cardsPreview.innerHTML = '';
    currentCards.forEach((c, i) => {
      const el = document.createElement('div');
      el.className = 'card-preview-item';
      el.innerHTML = `
        <div class="card-preview-text">
          <div class="card-preview-front">${c.front_text}</div>
          <div class="card-preview-back">${c.back_text}</div>
        </div>
        <button class="delete-preview-card" data-index="${i}">×</button>
      `;
      cardsPreview.appendChild(el);
    });
    cardsPreview.querySelectorAll('.delete-preview-card').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCards.splice(+btn.dataset.index, 1);
        updateCardsPreview();
      });
    });
  }

  // Поиск тестов
  function filterTests(e) {
    const term = e.target.value.trim().toLowerCase();
    const containers = [guestTestsContainer, userAllTestsContainer, userTestsContainer, userFavoritesContainer, userHistoryContainer];
    containers.forEach(cont => {
      if (!cont) return;
      const isGuest = cont === guestTestsContainer;
      const section = cont.closest('.section-content');
      const active = isGuest || section?.classList.contains('active');
      if (!active) return;
      cont.querySelectorAll('.no-results').forEach(x => x.remove());

      let any = false;
      cont.querySelectorAll('.test-item').forEach(item => {
        const nm = item.querySelector('.test-name')?.textContent.toLowerCase() || '';
        const show = nm.includes(term);
        item.style.display = show ? 'flex' : 'none';
        if (show) any = true;
      });
      if (!any) {
        const p = document.createElement('p');
        p.className = 'no-results';
        p.textContent = 'Ничего не найдено';
        p.style.textAlign = 'center';
        p.style.color = '#666';
        cont.appendChild(p);
      }
    });
  }

  // Функции для чатов и друзей
  async function loadChats() {
    try {
      chatState.isInChat = false;
      const response = await fetch('/get_chats');
      if (!response.ok) throw new Error('Ошибка загрузки чатов');
      const chats = await response.json();

      const chatsContent = document.getElementById('chatsContent');
      if (chatsContent) {
        chatsContent.innerHTML = `
          <button class="friend-requests-btn" id="friendRequestsBtn">Заявки</button>
          <div class="chats-container" id="chatsContainer"></div>
          <button class="add-friend-btn" id="addFriendBtn">+ Добавить друга</button>
        `;

        renderChats(chats);

        document.getElementById('friendRequestsBtn')?.addEventListener('click', () => {
          toggleModal(friendRequestsModal);
          loadFriendRequests();
        });
        document.getElementById('addFriendBtn')?.addEventListener('click', () => toggleModal(addFriendModal));
      }
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

    const chatsContent = document.getElementById('chatsContent');
    if (chatsContent) {
      chatsContent.innerHTML = `
        <div class="chat-header">
          <button class="back-to-chats-btn">← Назад</button>
          <div class="chat-avatar" style="${friendAvatar ? `background-image: url('/uploads/${friendAvatar}')` : ''}">
            ${friendAvatar ? '' : '👤'}
          </div>
          <div class="chat-title">${friendName}</div>
        </div>
        <div class="messages-container" id="messagesContainer"></div>
      `;

      document.querySelector('.back-to-chats-btn')?.addEventListener('click', () => {
        chatState.isInChat = false;
        loadChats();
      });

      await loadMessages(friendId);
    }
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
    if (!container) return;
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

      const isSaved = savedTests.has(`${message.test_creator_id}_${message.test_name}`);

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
      btn.addEventListener('click', function() {
        handleTestAction(this);
      });
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
    if (!friendRequestsList) return;
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
    const searchTerm = searchFriendInput?.value.trim();
    if (!searchTerm || searchTerm.length < 2) {
      if (searchFriendResults) searchFriendResults.innerHTML = '';
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
    if (!searchFriendResults) return;
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
    if (!friendsList) return;
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

  // Функция для запуска теста
  async function playTest(creatorId, testName) {
    try {
      const gameUrl = `/play_test/${creatorId}/${encodeURIComponent(testName)}`;
      window.open(gameUrl, '_blank');
    } catch (error) {
      console.error('Ошибка загрузки теста:', error);
      alert('Ошибка загрузки теста');
    }
  }

  // Проверка сохраненности теста
  function isTestSaved(creatorId, testName) {
    return savedTests.has(`${creatorId}_${testName}`);
  }
});