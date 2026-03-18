
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




