
/* Tested Function */
function createRecipe(data, username = "test@gmail.com") {
    const { name, ingredients, Steps, time, cost, tags, difficulty } = data;

    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!ingredients) missingFields.push("ingredients");
    if (!Steps) missingFields.push("Steps");
    if (!time) missingFields.push("time");
    if (!cost) missingFields.push("cost");
    if (!tags) missingFields.push("tags");
    if (!difficulty) missingFields.push("difficulty");

    if (missingFields.length > 0) {
        throw new Error(`Missing fields: ${missingFields.join(", ")}`);
    }

    // Format cost
    let formattedCost = cost.trim().replace(/\s/g, '');
    if (formattedCost.endsWith('$')) formattedCost = '$' + formattedCost.slice(0, -1);
    else if (!formattedCost.startsWith('$')) formattedCost = '$' + formattedCost;

    // Parse ingredients
    let parsedIngredients = [];
    try {
        parsedIngredients = JSON.parse(ingredients);
    } catch (err) {
        parsedIngredients = ingredients.split(',').map(item => item.trim());
    }

    return {
        id: "test-id", // mock id for testing
        username,
        name: name.trim(),
        ingredients: parsedIngredients,
        prepTime: time.trim(),
        prepSteps: Steps.trim(),
        cost: formattedCost,
        tag: tags.trim(),
        difficulty: difficulty.trim()
    };
}


/* Test */
describe("Add Recipe Logic", () => {

    test("Successfully creates a recipe object", () => {
        // Data that will be added
        const input = {
            name: "Test Pasta",
            ingredients: '["pasta","tomato"]',
            Steps: "Boil pasta, add sauce",
            time: "20 min",
            cost: "5$",
            tags: "Dinner",
            difficulty: "Easy"
        };

        //Creates a
        const recipe = createRecipe(input, "test@gmail.com");

        expect(recipe.name).toBe("Test Pasta");
        expect(recipe.ingredients).toEqual(["pasta", "tomato"]);
        expect(recipe.prepSteps).toBe("Boil pasta, add sauce");
        expect(recipe.cost).toBe("$5");
        expect(recipe.username).toBe("test@gmail.com");
    });

    test("Throws error if required fields are missing", () => {
        const input = {
            name: "",
            ingredients: '["pasta"]',
            Steps: "",
            time: "10 min",
            cost: "3$",
            tags: "Lunch",
            difficulty: "Medium"
        };

        expect(() => createRecipe(input)).toThrow(/Missing fields/);
    });

});