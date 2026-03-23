const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../server.js");

const RECIPES_FILE_PATH = path.join(__dirname, "../data/test-recipes.json");

const originalData = fs.readFileSync(RECIPES_FILE_PATH, "utf8");

beforeEach(() => {
    fs.writeFileSync(RECIPES_FILE_PATH, "[]");
}); // this will run before each test and clear recipes.json

afterAll(() => {
    fs.writeFileSync(RECIPES_FILE_PATH, originalData);
}); // this will run after each test and put back the original data

// Create (POST)
describe("Create (POST) Recipe Route Testing", () => {

    test("POST /recipes creates recipe with valid data", async () => {
        const agent = request.agent(app); // create agent

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can create recipes

        const before = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        const createRecipe = await agent.post("/recipes").send({
            name: "Test Recipe",
            ingredients: JSON.stringify(["egg", "milk"]),
            time: "10 mins",
            Steps: "Test Steps",
            cost: "$10",
            tags: "Test",
            difficulty: "easy" 
        });

        const after = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const newRecipe = after[0];

        expect(createRecipe.statusCode).toBe(302); // redirect
        expect(createRecipe.headers.location).toBe("/recipes");
        expect(after.length).toBe(before.length + 1);
        expect(newRecipe.name).toBe("Test Recipe");

    });

    test("POST /recipes does not create recipe with invalid data", async () => {
        const agent = request.agent(app); // create agent

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can create recipes

        const before = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        const createRecipe = await agent.post("/recipes").send({
            name: "Test Recipe",
            ingredients: JSON.stringify(["egg", "milk"]),
            time: "10 mins",
            Steps: "Test Steps",
            // cost: "$10", // now missing cost
            tags: "Test",
            difficulty: "easy" 
        });

        const after = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        expect(createRecipe.statusCode).toBe(302); // redirect
        expect(createRecipe.headers.location).toBe("/recipes");
        expect(after.length).toBe(before.length);

        const res = await agent.get("/recipes");

        expect(res.text).toContain("Submission Failed");

    });

});

// Read (GET)
describe("Read (GET) Recipe Route Testing", () => {

    test("GET /recipes returns page if logged in", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can access recipes page

        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
    });

    test("GET /recipes redirects if not logged in", async () => {
        const res = await request(app).get("/recipes");
        expect(res.statusCode).toBe(302);
    });

});

// Update/Edit (PUT)
describe("Update (PUT) Recipe Route Testing", () => {

    test("Update works with valid data", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can edit recipes

        // Create recipe to edit
        await agent.post("/recipes").send({
            name: "Original Recipe",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$10",
            tags: "Test",
            difficulty: "easy"
        });

        // Get existing recipe
        const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const recipe = [...recipes].reverse().find(r => r.username === "test@gmail.com" && r.name === "Original Recipe");
        const id = recipe.id;

        const updateRes = await agent
        .put(`/recipes/${id}`)
        .send({
            name: "Updated Recipe",
            ingredients: JSON.stringify(["updated"]),
            time: "20",
            Steps: "Updated steps",
            cost: "$20",
            tags: "Updated",
            difficulty: "easy"
        });

         // Read file again
        const updatedRecipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const updated = updatedRecipes.find(r => r.id === id);

        expect(updateRes.statusCode).toBe(302);
        expect(updateRes.headers.location).toBe("/recipes");
        expect(updated.name).toBe("Updated Recipe");
    });

    test("Update fails with missing required fields", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can edit recipes

        // Create recipe to edit
        await agent.post("/recipes").send({
            name: "Original Recipe",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$10",
            tags: "Test",
            difficulty: "easy"
        });

        // Get existing recipe
        const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const recipe = [...recipes].reverse().find(r => r.username === "test@gmail.com" && r.name === "Original Recipe");
        const id = recipe.id;
        
        const before = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        const updateRes = await agent
        .put(`/recipes/${id}`)
        .send({
            name: "Updated Recipe",
            ingredients: JSON.stringify(["updated"]),
            time: "20",
            Steps: "Updated steps",
            // cost: "$20", // now missing cost
            tags: "Updated",
            difficulty: "easy"
        });

        const after = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        expect(updateRes.statusCode).toBe(302);
        expect(updateRes.headers.location).toBe("/recipes");
        expect(after).toEqual(before);

        const res = await agent.get("/recipes");
        expect(res.text).toContain("Update failed");
    });

});

// Delete (DELETE)
describe("Delete (DELETE) Recipe Route Testing", () => {

    test("Delete existing recipe works", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can edit recipes

        // Create recipe to delete
        await agent.post("/recipes").send({
            name: "Original Recipe",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$10",
            tags: "Test",
            difficulty: "easy"
        });

        const before = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        // Get existing recipe
        const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const recipe = [...recipes].reverse().find(r => r.username === "test@gmail.com" && r.name === "Original Recipe");
        const id = recipe.id;

        // Delete it
        const deleteRes = await agent.delete(`/recipes/${id}`);

        const after = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        expect(deleteRes.statusCode).toBe(302);
        expect(deleteRes.headers.location).toBe("/recipes");
        expect(after.length).toBe(before.length - 1);

        const deleted = after.find(r => r.id === id);
        expect(deleted).toBeUndefined();
    });

    test("Delete does nothing if id does not exist", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        }); // login so agent can edit recipes

        const before = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        // random ID that won't exist
        const fakeId = "-999999";

        // Delete it
        const deleteRes = await agent.delete(`/recipes/${fakeId}`);

        const after = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));

        expect(deleteRes.statusCode).toBe(302);
        expect(deleteRes.headers.location).toBe("/recipes");
        expect(after).toEqual(before);
    });

});

// Search
describe("Search Recipe Testing", () => {

    test("Search returns matching recipes only", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        });

        // Create recipes
        await agent.post("/recipes").send({
            name: "Pasta",
            ingredients: JSON.stringify(["noodles"]),
            time: "10",
            Steps: "Steps",
            cost: "$10",
            tags: "Italian",
            difficulty: "easy"
        });

        await agent.post("/recipes").send({
            name: "Burger",
            ingredients: JSON.stringify(["beef"]),
            time: "20",
            Steps: "Steps",
            cost: "$15",
            tags: "FastFood",
            difficulty: "medium"
        });

        const res = await agent.get("/recipes?search=pasta");

        expect(res.statusCode).toBe(200);
        expect(res.text.toLowerCase()).toContain("pasta");
        expect(res.text.toLowerCase()).not.toContain("burger");
    });

});

// Filter
describe("Filter Recipe Testing", () => {

    // Time
    test("Filter by time returns correct recipes", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        });

        // Create recipes
        await agent.post("/recipes").send({
            name: "Quick Meal",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$5",
            tags: "Test",
            difficulty: "easy"
        });

        await agent.post("/recipes").send({
            name: "Slow Meal",
            ingredients: JSON.stringify(["beef"]),
            time: "60",
            Steps: "Steps",
            cost: "$20",
            tags: "Test",
            difficulty: "hard"
        });

        const res = await agent.get("/recipes?time=20");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Quick Meal");
        expect(res.text).not.toContain("Slow Meal");
    });

    // Difficulty
    test("Filter returns only easy recipes", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        });

        // Create recipes
        await agent.post("/recipes").send({
            name: "Easy Recipe",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$5",
            tags: "Test",
            difficulty: "easy"
        });

        await agent.post("/recipes").send({
            name: "Hard Recipe",
            ingredients: JSON.stringify(["beef"]),
            time: "30",
            Steps: "Steps",
            cost: "$20",
            tags: "Test",
            difficulty: "hard"
        });

        const res = await agent.get("/recipes?difficulty=easy");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Easy Recipe");
        expect(res.text).not.toContain("Hard Recipe");
    });

    // Cost
    test("Filter returns only low cost recipes", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        });

        // Create recipes
        await agent.post("/recipes").send({
            name: "Cheap Meal",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$10",
            tags: "Test",
            difficulty: "easy"
        });

        await agent.post("/recipes").send({
            name: "Expensive Meal",
            ingredients: JSON.stringify(["steak"]),
            time: "20",
            Steps: "Steps",
            cost: "$100",
            tags: "Test",
            difficulty: "easy"
        });

        const res = await agent.get("/recipes?cost=low");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Cheap Meal");
        expect(res.text).not.toContain("Expensive Meal");
    });

    // Tag
    test("Filter by tag returns correct recipes", async () => {
        const agent = request.agent(app);

        await agent.post("/login").send({
            username: "test@gmail.com",
            password: "test12345"
        });

        // Create recipes
        await agent.post("/recipes").send({
            name: "Vegan Recipe",
            ingredients: JSON.stringify(["egg"]),
            time: "10",
            Steps: "Steps",
            cost: "$5",
            tags: "Vegan",
            difficulty: "easy"
        });

        await agent.post("/recipes").send({
            name: "Keto Recipe",
            ingredients: JSON.stringify(["beef"]),
            time: "30",
            Steps: "Steps",
            cost: "$20",
            tags: "Keto",
            difficulty: "hard"
        });

        const res = await agent.get("/recipes?dietary=Vegan");

        expect(res.statusCode).toBe(200);
        expect(res.text).toContain("Vegan Recipe");
        expect(res.text).not.toContain("Keto Recipe");
    });

});