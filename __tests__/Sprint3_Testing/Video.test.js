
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../../server.js");


const RECIPES_FILE_PATH = path.join(__dirname, "../../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../../data/users.json");
const FAVORITES_FILE_PATH = path.join(__dirname, "../../data/favoriteRecipe.json");

const originalRecipesData = fs.readFileSync(RECIPES_FILE_PATH, "utf-8");
const originalUsersData = fs.readFileSync(USERS_FILE_PATH, "utf-8");
const originalFavoritesData = fs.readFileSync(FAVORITES_FILE_PATH, "utf-8");

// Reset the data files before each test to ensure test isolation
beforeEach(() => {
  fs.writeFileSync(RECIPES_FILE_PATH, "[]");
  fs.writeFileSync(USERS_FILE_PATH, "[]");
  fs.writeFileSync(FAVORITES_FILE_PATH, "[]");
}
);
// Restore the original data files after all tests have run
afterAll(() => {
    fs.writeFileSync(RECIPES_FILE_PATH, originalRecipesData);
    fs.writeFileSync(USERS_FILE_PATH, originalUsersData);
    fs.writeFileSync(FAVORITES_FILE_PATH, originalFavoritesData);
});

// ! Task 13.1 — "Watch Tutorial" button in modal
describe("Watch Video Endpoint", () => {

    test("should return the video URLs for a given recipe ID", async () => {
        // Write a recipe with video URLs directly to the JSON file
        const testRecipe = 
        {
            id: "test-video-123",
            username: "test@gmail.com",
            name: "Test Recipe",
            ingredients: ["ingredient1", "ingredient2"],
            prepTime: "30 min",
            prepSteps: "Test instructions",
            cost: "$5",
            tag: "dinner",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            videoURL_2: "https://www.youtube.com/watch?v=abc123",
            videoURL_3: null
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        // Request the video URLs for the created recipe
        const response = await request(app).get(`/recipes/${testRecipe.id}/video`);

        // Assert that the response is successful and contains the correct video URLs
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("videoURLs");
        expect(response.body.videoURLs).toEqual([
            testRecipe.videoURL_1,
            testRecipe.videoURL_2,
            testRecipe.videoURL_3
        ]);

    });

    // Test for a recipe that does not exist. No video URLs should be returned, and a 404 status code should be sent.
    test("should return 404 if the recipe is not found", async () => {
       
        const response = await request(app).get("/recipes/123/video");
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty("error", "Recipe not found");
    });

    test("should return an empty array if the recipe has no video URLs", async () => {
         const testRecipe = 
         {
            id: "test-video-123",
            username: "test@gmail.com",
            name: "Test Recipe",
            ingredients: ["ingredient1", "ingredient2"],
            prepTime: "30 min",
            prepSteps: "Test instructions",
            cost: "$5",
            tag: "dinner",
            difficulty: "easy",
                videoURL_1: null,
                videoURL_2: null,
                videoURL_3: null
        };

        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        // Request the video URLs for the created recipe
        const response = await request(app).get(`/recipes/${testRecipe.id}/video`);
        // Assert that the response is successful and contains an empty array
        expect(response.status).toBe(200);
        // Expect no video URLs to be returned
        expect(response.body).toHaveProperty("videoURLs");
        expect(response.body.videoURLs).toEqual([null, null, null]);
    });

    test("Recipe modal contains the Watch Tutorial (showVideoBtn) button", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('id="showVideoBtn"');
    });

    test("Recipe modal contains the video container (hidden by default)", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        // Check that the video container is present and hidden by default
        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('id="recipeVideoContainer"');
        expect(res.text).toContain('display: none');
    });

    test("Recipe modal contains video iframes", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('id="recipeVideoIframe1"');
        expect(res.text).toContain('id="recipeVideoIframe2"');
        expect(res.text).toContain('id="recipeVideoIframe3"');
    });

    
});



// ! Task 13.2 — YouTube redirect logic
describe("Task 13.2 - YouTube redirect logic", () => { 

    test("Video URLs returned are valid YouTube embed URLs", async () => {
        const testRecipe = {
            id: "yt-test-1",
            username: "test@gmail.com",
            name: "Embed Test Recipe",
            ingredients: ["a"],
            prepTime: "10 min",
            prepSteps: "Steps",
            cost: "$5",
            tag: "lunch",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            videoURL_2: "https://www.youtube.com/embed/abc123",
            videoURL_3: "https://www.youtube.com/embed/xyz789"
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        const response = await request(app).get(`/recipes/${testRecipe.id}/video`);

        expect(response.status).toBe(200);
        response.body.videoURLs.forEach(url => {
            if (url !== null) {
                expect(url).toMatch(/^https:\/\/www\.youtube\.com\/embed\/.+/);
            }
        });
    });

    test("Each recipe returns its own video URLs, not another recipe's", async () => {
        const recipe1 = {
            id: "yt-recipe-1",
            username: "test@gmail.com",
            name: "Recipe One",
            ingredients: ["a"],
            prepTime: "10 min",
            prepSteps: "Steps",
            cost: "$5",
            tag: "lunch",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/video1a",
            videoURL_2: "https://www.youtube.com/embed/video1b",
            videoURL_3: "https://www.youtube.com/embed/video1c"
        };
        const recipe2 = {
            id: "yt-recipe-2",
            username: "test@gmail.com",
            name: "Recipe Two",
            ingredients: ["b"],
            prepTime: "20 min",
            prepSteps: "Steps",
            cost: "$10",
            tag: "dinner",
            difficulty: "medium",
            videoURL_1: "https://www.youtube.com/embed/video2a",
            videoURL_2: "https://www.youtube.com/embed/video2b",
            videoURL_3: "https://www.youtube.com/embed/video2c"
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([recipe1, recipe2], null, 2));

        const res1 = await request(app).get(`/recipes/${recipe1.id}/video`);
        const res2 = await request(app).get(`/recipes/${recipe2.id}/video`);

        expect(res1.body.videoURLs).toEqual([recipe1.videoURL_1, recipe1.videoURL_2, recipe1.videoURL_3]);
        expect(res2.body.videoURLs).toEqual([recipe2.videoURL_1, recipe2.videoURL_2, recipe2.videoURL_3]);
    });

    test("Video endpoint returns exactly 3 URLs in the array", async () => {
        const testRecipe = {
            id: "yt-count-test",
            username: "test@gmail.com",
            name: "Count Test",
            ingredients: ["a"],
            prepTime: "5 min",
            prepSteps: "Steps",
            cost: "$3",
            tag: "snack",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/aaa",
            videoURL_2: null,
            videoURL_3: "https://www.youtube.com/embed/ccc"
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        const response = await request(app).get(`/recipes/${testRecipe.id}/video`);

        expect(response.status).toBe(200);
        expect(response.body.videoURLs).toHaveLength(3);
    });

});

// ! Task 13.3 — Pass recipe name dynamically

describe("Task 13.3 - Pass recipe name dynamically", () => {

    test("Created recipe stores the correct name in recipes.json", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        await agent.post("/recipes").send({
            name: "Pasta Carbonara",
            ingredients: JSON.stringify(["pasta", "egg", "bacon"]),
            time: "25 mins",
            Steps: "Cook pasta. Mix egg and cheese. Combine.",
            cost: "$15",
            tags: "Dinner",
            difficulty: "medium"
        });

        const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const created = recipes.find(r => r.name === "Pasta Carbonara");
        expect(created).toBeDefined();
        expect(created.name).toBe("Pasta Carbonara");
    });

    test("Recipe card includes the recipe name in data-name attribute", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        await agent.post("/recipes").send({
            name: "Spicy Tacos",
            ingredients: JSON.stringify(["tortilla", "beef", "salsa"]),
            time: "20 mins",
            Steps: "Cook beef. Assemble tacos.",
            cost: "$12",
            tags: "Spicy",
            difficulty: "easy"
        });

        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain('data-name="Spicy Tacos"');
    });

    test("Recipe card passes both data-id and data-name so modal can fetch videos for the correct recipe", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        await agent.post("/recipes").send({
            name: "Lemon Chicken",
            ingredients: JSON.stringify(["chicken", "lemon"]),
            time: "30 mins",
            Steps: "Marinate chicken. Bake.",
            cost: "$14",
            tags: "Dinner",
            difficulty: "medium"
        });

        // Get the ID that was assigned
        const recipes = JSON.parse(fs.readFileSync(RECIPES_FILE_PATH, "utf8"));
        const created = recipes.find(r => r.name === "Lemon Chicken");
        expect(created).toBeDefined();

        // Verify the rendered page has a card with both the correct id and name
        const res = await agent.get("/recipes");
        expect(res.statusCode).toBe(200);
        expect(res.text).toContain(`data-id="${created.id}"`);
        expect(res.text).toContain('data-name="Lemon Chicken"');

        // Verify the video endpoint for that ID is reachable (name -> id -> video link)
        const videoRes = await request(app).get(`/recipes/${created.id}/video`);
        expect(videoRes.status).toBe(200);
        expect(videoRes.body).toHaveProperty("videoURLs");
    });

    test("Video endpoint returns correct URLs for the right recipe by name", async () => {
        const recipeA = {
            id: "name-test-1",
            username: "test@gmail.com",
            name: "Banana Smoothie",
            ingredients: ["banana", "milk"],
            prepTime: "5 min",
            prepSteps: "Blend all.",
            cost: "$3",
            tag: "Breakfast",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/smoothie1",
            videoURL_2: "https://www.youtube.com/embed/smoothie2",
            videoURL_3: null
        };
        const recipeB = {
            id: "name-test-2",
            username: "test@gmail.com",
            name: "Grilled Salmon",
            ingredients: ["salmon", "lemon"],
            prepTime: "30 min",
            prepSteps: "Grill salmon.",
            cost: "$20",
            tag: "Dinner",
            difficulty: "hard",
            videoURL_1: "https://www.youtube.com/embed/salmon1",
            videoURL_2: "https://www.youtube.com/embed/salmon2",
            videoURL_3: "https://www.youtube.com/embed/salmon3"
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([recipeA, recipeB], null, 2));

        const resA = await request(app).get(`/recipes/${recipeA.id}/video`);
        const resB = await request(app).get(`/recipes/${recipeB.id}/video`);

        // Banana Smoothie gets its own URLs
        expect(resA.body.videoURLs).toEqual([recipeA.videoURL_1, recipeA.videoURL_2, recipeA.videoURL_3]);
        // Grilled Salmon gets its own URLs
        expect(resB.body.videoURLs).toEqual([recipeB.videoURL_1, recipeB.videoURL_2, recipeB.videoURL_3]);
    });

});

// ! POST — Favorite video endpoint
describe("POST /recipes/:id/video/favorites", () => {

    test("Logged-in user can favorite a video", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        const testRecipe = {
            id: "fav-test-1",
            username: "jesttest@gmail.com",
            name: "Fav Recipe",
            ingredients: ["a"],
            prepTime: "10 min",
            prepSteps: "Steps",
            cost: "$5",
            tag: "lunch",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/abc",
            videoURL_2: null,
            videoURL_3: null
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        const res = await agent.post(`/recipes/${testRecipe.id}/video/favorites`).send({
            videoURL: "https://www.youtube.com/embed/abc"
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);

        const favorites = JSON.parse(fs.readFileSync(FAVORITES_FILE_PATH, "utf8"));
        expect(favorites.length).toBe(1);
        expect(favorites[0].videoURL).toBe("https://www.youtube.com/embed/abc");
    });

    test("Should reject duplicate favorite", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        const testRecipe = {
            id: "fav-dup-1",
            username: "jesttest@gmail.com",
            name: "Dup Recipe",
            ingredients: ["a"],
            prepTime: "10 min",
            prepSteps: "Steps",
            cost: "$5",
            tag: "lunch",
            difficulty: "easy",
            videoURL_1: "https://www.youtube.com/embed/dup",
            videoURL_2: null,
            videoURL_3: null
        };
        fs.writeFileSync(RECIPES_FILE_PATH, JSON.stringify([testRecipe], null, 2));

        // Favorite once
        await agent.post(`/recipes/${testRecipe.id}/video/favorites`).send({
            videoURL: "https://www.youtube.com/embed/dup"
        });

        // Try to favorite again
        const res = await agent.post(`/recipes/${testRecipe.id}/video/favorites`).send({
            videoURL: "https://www.youtube.com/embed/dup"
        });

        expect(res.status).toBe(409);
        expect(res.body).toHaveProperty("error", "Video already in favorites.");
    });

    test("Should reject favorite with missing videoURL", async () => {
        const agent = request.agent(app);

        await agent.post("/register").send({
            username: "jesttest@gmail.com",
            password: "test12345",
            confirmPassword: "test12345"
        });

        await agent.post("/login").send({
            username: "jesttest@gmail.com",
            password: "test12345"
        });

        const res = await agent.post("/recipes/fav-test-1/video/favorites").send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("error", "Missing or invalid videoURL.");
    });

});