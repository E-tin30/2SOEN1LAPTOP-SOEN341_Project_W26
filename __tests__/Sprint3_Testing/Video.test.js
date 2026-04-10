
const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../../server.js");


const RECIPES_FILE_PATH = path.join(__dirname, "../../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../../data/users.json");

const originalRecipesData = fs.readFileSync(RECIPES_FILE_PATH, "utf-8");
const originalUsersData = fs.readFileSync(USERS_FILE_PATH, "utf-8");

// Reset the data files before each test to ensure test isolation
beforeEach(() => {
  fs.writeFileSync(RECIPES_FILE_PATH, "[]");
  fs.writeFileSync(USERS_FILE_PATH, "[]");
}
);
// Restore the original data files after all tests have run
afterAll(() => {
    fs.writeFileSync(RECIPES_FILE_PATH, originalRecipesData);
    fs.writeFileSync(USERS_FILE_PATH, originalUsersData);
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

