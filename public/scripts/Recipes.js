/* This script handles the opening and closing of the filter overlay on the recipes page. */
function toggleFilterOverlay(action) 
{
    const FilterOverlay = document.getElementById("FilterOverlay");

    if (action === "open") {
        FilterOverlay.style.display = "flex";
    } else if (action === "close") {
        FilterOverlay.style.display = "none";
    }
}


const btn = document.getElementById("OpenFilter");

const close = document.querySelector(".CloseBtn");

    // Open FilterOverlay
    btn.onclick = () => toggleFilterOverlay("open");

    // Close FilterOverlay
    close.onclick = () => toggleFilterOverlay("close");

    // Close if click outside FilterOverlay content
    window.onclick = (e) => 
{
        const FilterOverlay = document.getElementById("FilterOverlay");
        if (e.target === FilterOverlay) {
            toggleFilterOverlay("close");
        }
}



/* This script handles the opening and closing of the recipe creation modal on the recipes page. */
function OpenRecipeCreationUI()
{
    document.getElementById("RecipeCreationUIPopUp").classList.add("active"); // Activate the Popup 
}

function CloseRecipeCreationUI()
{
    document.getElementById("RecipeCreationUIPopUp").classList.remove("active");
}

// Recipe Creation Overlay
function toggleRecipeCreationOverlay(action) {
    const RecipeCreationOverlay = document.getElementById("RecipeCreationUIPopUp");

    if (action === "open") {
        RecipeCreationOverlay.style.display = "flex";
    } else if (action === "close") {
        RecipeCreationOverlay.style.display = "none";
    }
}
const openBtn = document.getElementById("OpenRecipeCreation");
const closeRecipeCreationBtn = document.querySelector(".CloseBtnRecipeCreation");

// Close RecipeCreationOverlay
openBtn.onclick = () => toggleRecipeCreationOverlay("open");
closeRecipeCreationBtn.onclick = () => toggleRecipeCreationOverlay("close");



/* This script handles the dynamic addition and removal of Ingredients in the recipe creation form. */
let Ingredients = [];

function addIngredient()
{
    const Input = document.getElementById("IngredientInput");

    const Value = Input.value.trim();

    if(Value === "")
        return;

    Ingredients.push(Value);

    updateIngredientList();

    Input.Value = "";
}

function updateIngredientList()
{
    const List = document.getElementById("IngredientList");

    List.innerHTML = "";

    Ingredients.forEach((Ingredient, index) =>
    {
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "X";
        removeBtn.className = "RemoveIngredientBtn"; // add a class
        removeBtn.onclick = () => removeIngredient(index);

        const NewList = document.createElement("li");
        NewList.textContent = Ingredient + " "; // add a space before button
        NewList.appendChild(removeBtn);

        List.appendChild(NewList);
    });

    // Store as JSON string for backend
    document.getElementById("IngredientsHidden").value =
        JSON.stringify(Ingredients);
}

function removeIngredient(index)
{
    Ingredients.splice(index, 1);

    updateIngredientList();
}


/* This script handles the dynamic addition and removal of Instructions in the recipe creation form. */

let CurrentStep = 0;
const Steps = () => document.querySelectorAll("#RecipeForm .Step");

function ShowStep(index)
{
    Steps().forEach((step, i) => {
        step.classList.remove("active");
        if (i === index) {
            step.classList.add("active");
        }
    });
}
// Validate current step inputs and move to next step
function NextStep()
{
    const step = Steps()[CurrentStep];
    let valid = true;

    // Validate inputs in current step
    const inputs = step.querySelectorAll("input, textarea");

    inputs.forEach(input => {

        
        if (input.type === "hidden") return;

        const errorDiv = document.getElementById(input.id + "Error");

        if (!input.value.trim())
        {
            if (errorDiv)
                errorDiv.textContent = "This field is required";

            valid = false;
        }
        else
        {
            if (errorDiv)
                errorDiv.textContent = "";
        }
    });

    if (!valid) return;

    // move forward
    if (CurrentStep < Steps().length - 1)
    {
        CurrentStep++;
        ShowStep(CurrentStep);
    }
}
