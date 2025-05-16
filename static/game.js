function initGame(originalPairs, keys, values) {
    let hasMatches = false;
    let draggedItem = null;
    let correctCount = 0;
    let dragGhost = null;

    function updateStats() {
        const remaining = document.querySelectorAll('#first-parts .phrase-part').length;
        document.getElementById('correct-count').textContent = correctCount;
        document.getElementById('remaining-phrases').textContent = remaining;

        if (remaining === 0) {
            const total = Object.keys(originalPairs).length;
            const percentage = Math.round((correctCount / total) * 100);
            let message;

            if (percentage === 100) {
                message = "Идеально! Все " + total + " фраз верны!";
            } else if (percentage >= 80) {
                message = "Отлично! " + correctCount + " из " + total + " верно (" + percentage + "%)";
            } else if (percentage >= 50) {
                message = "Хорошо! " + correctCount + " из " + total + " верно";
            } else {
                message = correctCount + " из " + total + " верно. Можно лучше!";
            }

            document.getElementById('result-text').textContent = message;
            document.getElementById('completion-message').style.display = 'block';
        }
    }

    function updateAreas() {
        const firstParts = document.querySelectorAll('#first-parts .phrase-part').length;
        const secondParts = document.querySelectorAll('#second-parts .phrase-part').length;
        const totalParts = firstParts + secondParts;

        if (totalParts === 0) {
            document.getElementById('areas-container').style.display = 'none';
        }

        updateStats();
    }

    function checkMatch(firstPart, secondPart) {
        return originalPairs[firstPart] === secondPart;
    }

    function createDragGhost(element, x, y) {
        dragGhost = document.createElement('div');
        dragGhost.className = 'drag-ghost';
        dragGhost.textContent = element.textContent;
        dragGhost.style.left = x + 'px';
        dragGhost.style.top = y + 'px';
        document.body.appendChild(dragGhost);
    }

    function moveDragGhost(x, y) {
        if (dragGhost) {
            dragGhost.style.left = x + 'px';
            dragGhost.style.top = y + 'px';
        }
    }

    function removeDragGhost() {
        if (dragGhost) {
            dragGhost.remove();
            dragGhost = null;
        }
    }

    document.querySelectorAll('.phrase-part').forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            this.classList.add('dragging');

            const dragImg = new Image();
            dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(dragImg, 0, 0);
            e.dataTransfer.setData('text/plain', this.dataset.value);

            createDragGhost(this, e.clientX, e.clientY);
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            removeDragGhost();
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            moveDragGhost(e.clientX, e.clientY);

            if (draggedItem && draggedItem.dataset.type !== this.dataset.type) {
                this.classList.add('drop-target');
            }
        });

        item.addEventListener('dragleave', function() {
            this.classList.remove('drop-target');
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drop-target');

            if (draggedItem && draggedItem.dataset.type !== this.dataset.type) {
                if (!hasMatches) {
                    document.getElementById('result-section').style.display = 'block';
                    hasMatches = true;
                }

                const firstPart = draggedItem.dataset.type === 'first'
                    ? draggedItem.dataset.original
                    : this.dataset.original;
                const secondPart = draggedItem.dataset.type === 'second'
                    ? draggedItem.dataset.original
                    : this.dataset.original;

                const isCorrect = checkMatch(firstPart, secondPart);

                const match = document.createElement('div');
                match.className = `matched-phrase ${isCorrect ? 'correct' : 'incorrect'}`;

                const icon = document.createElement('span');
                icon.style.marginRight = '10px';
                icon.textContent = isCorrect ? '✓' : '✗';
                icon.style.color = isCorrect ? 'var(--correct)' : 'var(--incorrect)';
                icon.style.fontWeight = 'bold';

                match.appendChild(icon);
                match.appendChild(document.createTextNode(`${draggedItem.textContent} ${this.textContent}`));

                document.getElementById('results').appendChild(match);

                draggedItem.remove();
                this.remove();

                if (isCorrect) correctCount++;
                updateAreas();
            }
        });
    });

    document.addEventListener('dragover', function(e) {
        moveDragGhost(e.clientX, e.clientY);
    });
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}