
const addMealPlanForm = document.querySelector(".addMealPlanOverlay");
const filterButton = document.getElementsByClassName("closeAddMealPlanOverlay");

function toggleAddMealPlanOverlay(action) 
{

    if (action === "open") {
        addMealPlanForm.style.display = "flex";
    } else if (action === "close") {
        addMealPlanForm.style.display = "none";
    }
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