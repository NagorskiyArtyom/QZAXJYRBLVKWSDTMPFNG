document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const sections = document.querySelectorAll('.section');
    const sectionContents = document.querySelectorAll('.section-content');
    const avatarBtn = document.getElementById('avatarBtn');
    const avatarModal = document.getElementById('avatarModal');
    const closeAvatarBtn = document.getElementById('closeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    const avatarPreview = document.getElementById('avatarPreview');
    const authBtn = document.getElementById('authBtn');
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthBtn');
    const authTabBtns = document.querySelectorAll('.auth-tab-btn');
    const cardForm = document.getElementById('cardForm');
    const cardsContainer = document.getElementById('cardsContainer');
    const addTestBtn = document.getElementById('addTestBtn');
    const addTestContainer = document.getElementById('addTestContainer');
    const testNameInput = document.getElementById('testName');
    const cardsPreview = document.getElementById('cardsPreview');
    const cancelTestBtn = document.querySelector('.cancel-test-btn');
    const createTestBtn = document.querySelector('.create-test-btn');
    const addCardBtn = document.querySelector('.add-card-btn');
    const cardFrontInput = document.querySelector('.card-front-input');
    const cardBackInput = document.querySelector('.card-back-input');

    let currentCards = [];

    if (addTestBtn) {
        addTestBtn.addEventListener('click', function() {
            addTestBtn.classList.add('hidden');
            addTestContainer.classList.remove('hidden');
            testNameInput.focus();
        });
    }

    if (cancelTestBtn) {
        cancelTestBtn.addEventListener('click', function() {
            resetTestForm();
        });
    }

    if (addCardBtn) {
        addCardBtn.addEventListener('click', function() {
            const frontText = cardFrontInput.value.trim();
            const backText = cardBackInput.value.trim();

            if (frontText && backText) {
                currentCards.push({
                    front_text: frontText,
                    back_text: backText
                });

                updateCardsPreview();
                cardFrontInput.value = '';
                cardBackInput.value = '';
                cardFrontInput.focus();
            }
        });
    }

    if (createTestBtn) {
        createTestBtn.addEventListener('click', function() {
            const testName = testNameInput.value.trim();

            if (!testName) {
                alert('Пожалуйста, введите название теста');
                return;
            }

            if (currentCards.length === 0) {
                alert('Добавьте хотя бы одну фразу');
                return;
            }

            const savePromises = currentCards.map(card => {
                card.test_name = testName;
                return saveCardToServer(card);
            });

            Promise.all(savePromises)
                .then(() => {
                    resetTestForm();
                    alert('Тест успешно создан!');
                })
                .catch(error => {
                    if (error.error === 'У вас уже есть тест с таким названием') {
                        testNameError.textContent = 'У вас уже есть тест с таким названием. Пожалуйста, выберите другое название.';
                        testNameError.style.display = 'block';
                    } else {
                        testNameError.textContent = 'Произошла ошибка при сохранении теста: ' + (error.error || 'Неизвестная ошибка');
                        testNameError.style.display = 'block';
                    }
                });
        });
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
                const index = parseInt(this.dataset.index);
                currentCards.splice(index, 1);
                updateCardsPreview();
            });
        });
    }

    function saveCardToServer(cardData) {
        return fetch('/add_card', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cardData)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => Promise.reject(err));
            }
            return response.json();
        });
    }

    function resetTestForm() {
        currentCards = [];
        testNameInput.value = '';
        cardFrontInput.value = '';
        cardBackInput.value = '';
        cardsPreview.innerHTML = '';
        addTestContainer.classList.add('hidden');
        addTestBtn.classList.remove('hidden');
    }


    if (cardsContainer) {
        loadCards();
    }

    function loadCards() {
        fetch('/get_cards')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(cards => {
                if (cards.error) {
                    console.error(cards.error);
                    return;
                }

                cardsContainer.innerHTML = '';
                cards.forEach(card => {
                    addCardToDOM(card);
                });
            })
            .catch(error => console.error('Error loading cards:', error));
    }

    function addCardToDOM(card) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-item';
        cardElement.dataset.id = card.id;
        cardElement.innerHTML = `
            <div class="card-text">
                <div class="card-front">${card.front_text}</div>
                <div class="card-back">${card.back_text}</div>
            </div>
            <button class="delete-card" data-id="${card.id}">Удалить</button>
        `;
        cardsContainer.appendChild(cardElement);

        const deleteBtn = cardElement.querySelector('.delete-card');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteCard(card.id);
        });
    }

    function deleteCard(cardId) {
        if (confirm('Вы уверены, что хотите удалить эту фразу?')) {
            fetch(`/delete_card/${cardId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    return;
                }

                const cardElement = document.querySelector(`.card-item[data-id="${cardId}"]`);
                if (cardElement) {
                    cardElement.remove();
                }
            })
            .catch(error => console.error('Error deleting card:', error));
        }
    }

    if (cardForm) {
        cardForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const frontText = document.getElementById('frontText').value.trim();
            const backText = document.getElementById('backText').value.trim();

            if (frontText && backText) {
                fetch('/add_card', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        front_text: frontText,
                        back_text: backText
                    })
                })
                .then(response => {
                    if (!response.ok) throw new Error('Network response was not ok');
                    return response.json();
                })
                .then(data => {
                    if (data.error) {
                        alert(data.error);
                        return;
                    }

                    cardForm.reset();
                    addCardToDOM(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Произошла ошибка при добавлении фразы');
                });
            }
        });
    }

    if (menuBtn && sectionsContainer) {
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sectionsContainer.classList.toggle('hidden');
        });
    }

    sections.forEach(section => {
        section.addEventListener('click', function() {
            sections.forEach(s => s.classList.remove('active'));
            sectionContents.forEach(c => c.classList.remove('active'));

            this.classList.add('active');
            const sectionId = this.dataset.section + 'Content';
            const sectionContent = document.getElementById(sectionId);
            if (sectionContent) sectionContent.classList.add('active');
        });
    });

    if (avatarBtn && avatarModal) {
        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarModal.classList.remove('hidden');
        });

        closeAvatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            avatarModal.classList.add('hidden');
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

    if (authBtn && authModal) {
        authBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            authModal.classList.remove('hidden');
        });

        closeAuthBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            authModal.classList.add('hidden');
        });
    }

    if (authTabBtns.length > 0) {
        authTabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                authTabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.auth-tab-pane').forEach(p => p.classList.remove('active'));

                this.classList.add('active');
                const tabForm = document.getElementById(this.dataset.tab + 'Form');
                if (tabForm) tabForm.classList.add('active');
            });
        });
    }

    document.addEventListener('click', function(e) {
        if (e.target === avatarModal) {
            avatarModal.classList.add('hidden');
        }
        if (e.target === authModal) {
            authModal.classList.add('hidden');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        }
    });

    if (sections.length > 0) {
        sections[0].click();
    }

    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            console.log('Searching for:', searchTerm);
        });
    }
});