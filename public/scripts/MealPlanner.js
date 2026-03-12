


/* HARDCODED NEED TO REPLACE WITH API CALL TO GET RECIPES FROM DATABASE
*/
document.addEventListener("DOMContentLoaded", () => {
    const recipe = {
      id: "1001",
      name: "Creamy Garlic Chicken Pasta bla bla bla",
      prepTime: "30 mins",
      cost: "$12",
      tag: "Protein+",
      difficulty: "easy",
      type: "Dinner",
      time: "12:30 pm"
    };
  
    function addRecipeToDay(recipe, day) {
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
  
    // Example: add the same recipe to Monday
    /* In a real application, you would loop through the recipes and days based on user input or API data */
    addRecipeToDay(recipe, "Monday");
    addRecipeToDay(recipe, "Tuesday");
    addRecipeToDay(recipe, "Wednesday");
    addRecipeToDay(recipe, "Thursday");
    addRecipeToDay(recipe, "Friday");
    addRecipeToDay(recipe, "Saturday");
    addRecipeToDay(recipe, "Sunday");
    addRecipeToDay(recipe, "Sunday");
    addRecipeToDay(recipe, "Sunday");
  });
