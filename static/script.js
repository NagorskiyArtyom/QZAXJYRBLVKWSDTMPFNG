document.addEventListener('DOMContentLoaded', () => {
  // Элементы страницы
  const homeBtn               = document.querySelector('.home-btn');
  const menuBtn               = document.getElementById('menuBtn');
  const sections              = document.querySelectorAll('.section');
  const sectionContents       = document.querySelectorAll('.section-content');
  const searchBar             = document.querySelector('.search-bar');

  // Модалки
  const authBtn               = document.getElementById('authBtn');
  const authModal             = document.getElementById('authModal');
  const closeAuthBtn          = document.getElementById('closeAuthBtn');
  const authTabBtns           = document.querySelectorAll('.auth-tab-btn');
  const avatarBtn             = document.getElementById('avatarBtn');
  const avatarModal           = document.getElementById('avatarModal');
  const closeAvatarBtn        = document.getElementById('closeAvatarBtn');

  // Форма создания тестов
  const addTestBtn            = document.getElementById('addTestBtn');
  const addTestContainer      = document.getElementById('addTestContainer');
  const testNameInput         = document.getElementById('testName');
  const cancelTestBtn         = document.querySelector('.cancel-test-btn');
  const createTestBtn         = document.querySelector('.create-test-btn');
  const addCardBtn            = document.querySelector('.add-card-btn');
  const cardFrontInput        = document.querySelector('.card-front-input');
  const cardBackInput         = document.querySelector('.card-back-input');
  const cardsPreview          = document.getElementById('cardsPreview');
  const testNameError         = document.getElementById('testNameError');

  // Контейнеры списков тестов
  const userAllTestsContainer = document.getElementById('userAllTestsContainer');
  const userTestsContainer    = document.getElementById('userTestsContainer');
  const userFavoritesContainer= document.getElementById('userFavoritesContainer');
  const guestTestsContainer   = document.getElementById('guestTestsContainer');
  const userHistoryContainer  = document.getElementById('userHistoryContainer');

  let currentCards = [];
  const savedTests = new Map();

  // Простейшие вспомогательные функции
  function toggleModal(modal) {
    modal.classList.toggle('hidden');
  }
  function showError(msg) {
    testNameError.textContent = msg;
    testNameError.style.display = 'block';
  }
  function hideError() {
    testNameError.style.display = 'none';
  }

  // Обработчики Auth-модалки
  authBtn?.addEventListener('click', e => {
    e.stopPropagation();
    toggleModal(authModal);
    // Переключаем на вкладку "Вход"
    authTabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelector('.auth-tab-btn[data-tab="login"]')?.classList.add('active');
    document.getElementById('loginForm')?.classList.add('active');
  });
  closeAuthBtn?.addEventListener('click', e => {
    e.stopPropagation();
    authModal.classList.add('hidden');
  });
  authModal?.querySelector('.auth-modal-content')
    ?.addEventListener('click', e => e.stopPropagation());

  authTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      authTabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab + 'Form')?.classList.add('active');
      // Скрываем предыдущие ошибки, если были
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
  avatarModal?.querySelector('.avatar-modal')
    ?.addEventListener('click', e => e.stopPropagation());
  document.addEventListener('click', e => {
    if (!avatarModal.classList.contains('hidden') && e.target === avatarModal) {
      avatarModal.classList.add('hidden');
    }
  });

  // Валидация формы регистрации
  const registerForm = document.getElementById('registerFormElement');
  if (registerForm) {
    const emailInput = document.getElementById('registerEmail');
    const passInput  = document.getElementById('registerPassword');
    const emailError = document.getElementById('registerEmailError');
    const passError  = document.getElementById('registerPasswordError');

    registerForm.addEventListener('submit', e => {
      let valid = true;
      emailError.style.display = 'none';
      passError.style.display  = 'none';
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

  // Запуск первоначальной загрузки
  initPage();
  async function initPage() {
    await loadSavedTests();
    // Загрузка всех тестов (или гостевых)
    const initial = userAllTestsContainer || guestTestsContainer;
    if (initial) await loadAllTests(initial);
    if (userTestsContainer) await loadUserTests();
    bindUIActions();
  }

  function bindUIActions() {
    homeBtn?.addEventListener('click', e => { e.preventDefault(); showSection('mainContent'); });
    menuBtn?.addEventListener('click', e => { e.stopPropagation(); document.getElementById('sectionsContainer').classList.toggle('hidden'); });
    sections.forEach(sec => sec.addEventListener('click', () => showSection(sec.dataset.section + 'Content')));

    addTestBtn?.addEventListener('click', showForm);
    cancelTestBtn?.addEventListener('click', resetForm);
    addCardBtn?.addEventListener('click', addCard);
    createTestBtn?.addEventListener('click', createTest);

    searchBar?.addEventListener('input', filterTests);

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
  }

  // Переключение разделов
  function showSection(id) {
    sectionContents.forEach(c => c.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
    sections.forEach(s => s.classList.remove('active'));
    document.querySelector(`.section[data-section="${id.replace('Content','')}"]`)?.classList.add('active');
    if (id === 'testsContent') {
      resetForm(); loadUserTests();
    } else if (id === 'favoritesContent') {
      loadFavorites();
    } else if (id === 'historyContent') {
      loadHistory();
    } else if (id === 'mainContent') {
      loadAllTests(userAllTestsContainer || guestTestsContainer);
    }
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

  // Рендер списка тестов в контейнер
  function renderTests(tests, container) {
    container.innerHTML = '';
    if (!tests.length) {
      container.innerHTML = '<p style="text-align:center;color:#666;">Тесты не найдены</p>';
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
        <button class="test-action-btn ${isFav?'delete':'save'}"
                data-test-name="${test.test_name}"
                data-creator-id="${test.creator_id}"></button>
      `;
      div.querySelector('.test-action-btn')
         .addEventListener('click', e => { e.stopPropagation(); toggleFavorite(e.currentTarget); });
      div.addEventListener('click', () => recordHistory(test));
      container.appendChild(div);
    });
  }

  // Загрузить разные списки
  async function loadAllTests(container) {
    try {
      const res = await fetch('/get_all_tests'); if (!res.ok) throw new Error();
      renderTests(await res.json(), container);
    } catch {
      container.innerHTML = '<p style="text-align:center;color:#666;">Ошибка загрузки</p>';
    }
  }
  async function loadUserTests() {
    try {
      const res = await fetch('/get_tests'); if (!res.ok) throw new Error();
      renderTests(await res.json(), userTestsContainer);
    } catch {
      userTestsContainer.innerHTML = '<p style="text-align:center;color:#666;">Ошибка загрузки</p>';
    }
  }
  async function loadFavorites() {
    try {
      const res = await fetch('/get_saved_tests'); if (!res.ok) throw new Error();
      renderTests(await res.json(), userFavoritesContainer);
    } catch {
      userFavoritesContainer.innerHTML = '<p style="text-align:center;color:#666;">Ошибка загрузки</p>';
    }
  }

  // Переключение избранного
  async function toggleFavorite(btn) {
    const name = btn.dataset.testName;
    const creator = btn.dataset.creatorId;
    const isDel = btn.classList.contains('delete');
    try {
      const res = await fetch(isDel?'/unsave_test':'/save_test', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({creator_id: creator, test_name: name})
      });
      if (!res.ok) throw new Error();
      if (isDel) savedTests.delete(`${creator}_${name}`);
      else savedTests.set(`${creator}_${name}`, true);
      btn.classList.toggle('delete', !isDel);
      btn.classList.toggle('save', isDel);
      [userAllTestsContainer, userTestsContainer, userFavoritesContainer].forEach(c => {
        c?.querySelectorAll(
          `[data-test-name="${name}"][data-creator-id="${creator}"]`
        ).forEach(b => {
          b.classList.toggle('delete', !isDel);
          b.classList.toggle('save', isDel);
        });
      });
    } catch (e) {
      console.error('Ошибка сохранения избранного:', e);
    }
  }

  // История
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
      userHistoryContainer.innerHTML = '<p style="text-align:center;color:#666;">История пуста</p>';
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
    addTestBtn.classList.add('hidden');
    userTestsContainer && (userTestsContainer.style.display = 'none');
    addTestContainer.classList.remove('hidden');
    testNameInput.focus();
  }
  function resetForm() {
    currentCards = [];
    testNameInput.value = '';
    cardFrontInput.value = '';
    cardBackInput.value = '';
    cardsPreview.innerHTML = '';
    hideError();
    addTestContainer.classList.add('hidden');
    addTestBtn.classList.remove('hidden');
    userTestsContainer && (userTestsContainer.style.display = 'flex');
  }

  // Создать тест
  async function createTest() {
    const name = testNameInput.value.trim();
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
    const f = cardFrontInput.value.trim();
    const b = cardBackInput.value.trim();
    if (!f || !b) return;
    currentCards.push({ front_text: f, back_text: b });
    updateCardsPreview();
    cardFrontInput.value = '';
    cardBackInput.value = '';
    cardFrontInput.focus();
  }
  function updateCardsPreview() {
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
});
