

/* This script handles the opening and closing of the filter overlay on the recipes page. */
const FilterOverlay = document.getElementById("FilterOverlay");
const btn = document.getElementById("OpenFilter");
const close = document.querySelector(".CloseBtn");

// Open FilterOverlay
btn.onclick = () => {
    FilterOverlay.style.display = "flex";
}

// Close FilterOverlay
close.onclick = () => {
    FilterOverlay.style.display = "none";
}

// Close if click outside FilterOverlay content
window.onclick = (e) => {
    if (e.target === FilterOverlay) {
        FilterOverlay.style.display = "none";
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
        const NewList = document.createElement("NewList");

        NewList.innerHTML =
        Ingredient +
        ' <button onclick="removeIngredient(' + index + ')">X</button>';

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

const Steps = document.querySelectorAll(".Step");

function ShowStep(index)
{
    Steps.forEach(Step => Step.classList.remove("active"));
    Steps[index].classList.add("active");
}

function NextStep()
{
    const Inputs = Steps[CurrentStep].querySelectorAll("input, textarea");

    for (let input of Inputs)
    {
        if (!input.value.trim())
        {
            alert("Please fill this field");
            return;
        }
    }

    CurrentStep++;

    if (CurrentStep >= Steps.length)
        CurrentStep = Steps.length - 1;

    ShowStep(CurrentStep);
}

function PrevStep()
{
    CurrentStep--;

    if (CurrentStep < 0)
        CurrentStep = 0;

    ShowStep(CurrentStep);
}

