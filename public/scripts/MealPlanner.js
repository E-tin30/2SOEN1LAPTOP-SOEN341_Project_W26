


/* HARDCODED NEED TO REPLACE WITH API CALL TO GET RECIPES FROM DATABASE
*/
document.addEventListener("DOMContentLoaded", () => {
  
    // Function to add a recipe to a specific day
    function addRecipeToDay(recipe, day) 
    {
      const container = document.getElementById(day + "Recipes");   
      if (!container) return;
      const RecipeCard = document.createElement("div");
      RecipeCard.classList.add("RecipeCard");
      
      const RecipeName = document.createElement("h3");
      RecipeName.classList.add("RecipeName");
      RecipeName.textContent = recipe.name;
      RecipeCard.appendChild(RecipeName);  // Add recipe name to RecipeCard
      
      const item = document.createElement("div");
      item.classList.add("CardRecipesItem");
      item.innerHTML = `
       <span class="TypeMeal">${recipe.type}</span>
        <span class="MealTime">${recipe.time}</span>
        `;
      RecipeCard.appendChild(item);  // Add recipe details to RecipeCard
      container.appendChild(RecipeCard);  // Add RecipeCard to container
    }

    async function FetchWeeklyPlan()
    {
        try
        {
            const response  = await fetch("/meal-planner?format=json");
            const data = await response.json();

            if (!data.plan) return; // No plan found

            data.plan.forEach(dayEntry => {
                dayEntry.meals.forEach(meal => {
                    addRecipeToDay(meal, dayEntry.day);
                });
            });
        }
        catch (error)
        {
            console.error("Error fetching meal plan:", error);
        }
    }

    // Global function to add a recipe 
    /* FUNCTION TO ADD A NEW RECIPE TO AVAILABLE RECIPES OF THE USER */
  async function addRecipe(day, mealType, recipe) {
    try 
    {
      // POST the new recipe to backend
      await fetch('/meal-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: [{
            week: recipe.week || "current", // optional week
            day,
            meals: [{ type: mealType, recipeId: recipe.id, name: recipe.name, time: recipe.time }]
          }]
        })
      });

      // Instantly add the recipe to the day in the frontend
      addRecipeToDay(recipe, day);
    } 
    catch (err) 
    {
      console.error("Error adding recipe:", err);
    }
  }

  window.addRecipe = addRecipe; // Expose globally for + button
  window.FetchWeeklyPlan = FetchWeeklyPlan; // Expose globally for initial load
  
  // Fetch and render the weekly plan on page load
  FetchWeeklyPlan();
  });


