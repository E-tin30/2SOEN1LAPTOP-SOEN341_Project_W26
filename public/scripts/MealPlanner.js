const recipe = {
    id: "1001",
    name: "Creamy Garlic Chicken Pasta",
    prepTime: "30 mins",
    cost: "$12",
    tag: "Protein+",
    difficulty: "easy"
  };
  
  // Function to add a recipe to a day
  function addRecipeToDay(recipe, day) {
      const container = document.getElementById(day + "Recipes");
      const recipeDiv = document.createElement("div");
      recipeDiv.className = "recipe-card";
      recipeDiv.innerHTML = `
          <h3>${recipe.name}</h3>
          <div class="recipe-meta">
              
          </div>
      `;
      container.appendChild(recipeDiv);
  }
  
  // Example: adding this recipe to Monday
  addRecipeToDay(recipe, "Monday");

