const cards = document.querySelectorAll('.recipe-card');
const modal = document.getElementById('recipeModal');
const closeBtn = document.getElementById('closeModal');
const modalContent = document.getElementById('modalContent');


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

        if (modalContent) {
            modalContent.dataset.id = card.dataset.id;
        }

        const ingredients = JSON.parse(card.dataset.ingredients);
        const list = document.getElementById('modalIngredients');
        list.innerHTML = "";

        ingredients.forEach(i => {
            const li = document.createElement('li');
            li.textContent = i;
            list.appendChild(li);
        });
        modalContent.dataset.id = card.dataset.id;
        modal.classList.remove('hidden');
    });
});


const favoriteVideo = async (recipeId, videoURL) => {
    try {
        const response = await fetch(`/recipes/${recipeId}/video/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoURL }),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to save favorite');
        }

        return true;
    } catch (error) {
        console.error('Favorite video error:', error);
        return false;
    }
};

const NotfavoriteVideo = async (recipeId, videoURL) => {
    try {
        const response = await fetch(`/favorites/${recipeId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ videoURL }),
        });

        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || 'Failed to remove favorite');
        }

        return true;
    } catch (error) {
        console.error('Unfavorite video error:', error);
        return false;
    }
}

const attachHeartCheckboxListeners = () => {
    document.querySelectorAll('.heart-checkbox').forEach((checkbox, index) => {
        checkbox.addEventListener('change', async () => {
            const recipeId = modalContent?.dataset?.id;
            const iframe = document.getElementById(`recipeVideoIframe${index + 1}`);
            const videoURL = iframe?.src?.trim();

            if (!recipeId || !videoURL) {
                checkbox.checked = false;
                alert('No video URL available. Please open the video first.');
                return;
            }

            if (checkbox.checked) {
                // Favorite the video
                const success = await favoriteVideo(recipeId, videoURL);
                if (!success) {
                    checkbox.checked = false;
                    alert('Could not save favorite video. Please try again.');
                }
            } else {
                // Unfavorite the video
                const success = await NotfavoriteVideo(recipeId, videoURL);
                if (!success) {
                    checkbox.checked = true;
                    alert('Could not remove favorite video. Please try again.');
                }
            }
        });
    });
};


attachHeartCheckboxListeners();

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
