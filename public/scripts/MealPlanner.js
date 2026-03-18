//Remove function
const deleteForms = document.querySelectorAll('.deleteBtn');

deleteForms.forEach(button => {
    button.addEventListener('click', (e) => {
        const confirmDelete = confirm("Are you sure you want to delete this recipe from your plan?");
        if (!confirmDelete) {
            e.preventDefault();
        }
    });
});

// Auto-dismiss flash message
const flash = document.querySelector('.flash-message');

if (flash) {
    setTimeout(() => {
        flash.style.transition = "opacity 0.4s ease";
        flash.style.opacity = "0";

        setTimeout(() => {
            flash.remove();
        }, 400);
    }, 3000);
}

// Meal creation popup helpers (mirror the recipe "Create" modal behavior)
function OpenMealCreationUI() {
    const popup = document.getElementById("MealCreationUIPopUp");
    if (!popup) return;
    popup.classList.add("active");
}

function CloseMealCreationUI() {
    const popup = document.getElementById("MealCreationUIPopUp");
    if (!popup) return;
    popup.classList.remove("active");
}

// Meal edit popup helpers
function OpenMealEditUI() {
    const popup = document.getElementById("MealEditUIPopUp");
    if (!popup) return;
    popup.classList.add("active");
}

function CloseMealEditUI() {
    const popup = document.getElementById("MealEditUIPopUp");
    if (!popup) return;
    popup.classList.remove("active");
}

// Wire up edit buttons to pre-fill the edit modal
document.querySelectorAll('.meal-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const day = btn.dataset.day || "";
        const mealIndex = btn.dataset.mealIndex || "";
        const name = btn.dataset.name || "";
        const type = btn.dataset.type || "";
        const time = btn.dataset.time || "";

        const dayEl = document.getElementById('MealEditDay');
        const idxEl = document.getElementById('MealEditMealIndex');
        const nameEl = document.getElementById('MealEditName');
        const typeEl = document.getElementById('MealEditType');
        const timeEl = document.getElementById('MealEditTime');

        if (dayEl) dayEl.value = day;
        if (idxEl) idxEl.value = mealIndex;
        if (nameEl) nameEl.value = name;
        if (typeEl) typeEl.value = type;
        if (timeEl) timeEl.value = time;

        OpenMealEditUI();
    });
});