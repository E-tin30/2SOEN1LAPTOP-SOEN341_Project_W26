
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
        const testRecipe = {
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

});