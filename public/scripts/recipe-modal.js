const cards = document.querySelectorAll('.recipe-card');
const modal = document.getElementById('recipeModal');
const closeBtn = document.getElementById('closeModal');

cards.forEach(card => {
    card.addEventListener('click', () => {
        document.getElementById('modalName').textContent = card.dataset.name;
        
        const tag = card.dataset.tag;
        const modalTag = document.getElementById('modalTag');

        const difficulty = card.dataset.difficulty;
        const modalDifficulty = document.getElementById("modalDifficulty");

        if (tag) {
            modalTag.textContent = tag;
            modalTag.style.display = "inline-block";
        } else {
            modalTag.style.display = "none";
        }

        if (difficulty) {
            modalDifficulty.textContent = difficulty;
            modalDifficulty.style.display = "inline-block";
            modalDifficulty.classList.remove("easy", "medium", "hard");
            modalDifficulty.classList.add(difficulty.toLowerCase());
        } else {
            modalDifficulty.style.display = "none";
        }

        document.getElementById('modalPrepTime').textContent = card.dataset.preptime;
        document.getElementById('modalSteps').textContent = card.dataset.steps;
        document.getElementById('modalCost').textContent = card.dataset.cost;

        const ingredients = JSON.parse(card.dataset.ingredients);
        const list = document.getElementById('modalIngredients');
        list.innerHTML = "";

        ingredients.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            list.appendChild(li);
        });

        modal.classList.remove('hidden');
    });
});

closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

modal.addEventListener('click', e => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

/* Prevent modal opening when clicking edit/delete */
document.querySelectorAll('.icon-btn').forEach(btn => {
    btn.addEventListener('click', e => {
        e.stopPropagation();
    });
});