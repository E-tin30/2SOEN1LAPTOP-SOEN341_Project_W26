

/** Function to toggle the recipe schedule overlay */
    function toggleRecipeScheduleOverlay(action){
        const RecipeScheduleOverlay = document.getElementById("schedule-recipe-overlay");
         if (action === "open") {
        RecipeScheduleOverlay.style.display = "flex";
        } else if (action === "close") {
        RecipeScheduleOverlay.style.display = "none";
        }

    }