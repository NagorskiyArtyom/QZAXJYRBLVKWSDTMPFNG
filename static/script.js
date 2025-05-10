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