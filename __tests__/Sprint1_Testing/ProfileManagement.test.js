/* 
*
*   Unit tests for profile management functions: findUserPreference and updateUserPreferences.
*   Integration tests for GET /profile and POST /api/save-profile routes.
*
*/

const { updateUserPreferences, findUserPreference } = require('../../routes/profileRoutes');    // Importing the functions to test
const request = require('supertest');
const app = require('../../server');
const fs = require('fs');
const path = require('path');

const PREFERENCES_FILE = path.join(__dirname, '../../data/preferences.json');

// ==================== findUserPreference ====================
describe('Profile Management - findUserPreference', () => {

        // Mocking Data
    const allPrefs = [
        { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts"] },
        { username: "john@gmail.com", preference: "Vegan", allergies: ["Gluten", "Dairy"] },
        { username: "sarah@gmail.com", preference: "Keto", allergies: [] }
    ];

    test("should return the correct user's preferences", () => {
        const result = findUserPreference(allPrefs, "test@gmail.com");
        expect(result.username).toBe("test@gmail.com");
        expect(result.preference).toBe("Liquid");
        expect(result.allergies).toEqual(["Peanuts"]);
    });

    test("should return null if user does not exist", () => {
        const result = findUserPreference(allPrefs, "unknown@gmail.com");
        expect(result).toBeNull();
    });

    test("should return null if preferences array is empty", () => {
        const result = findUserPreference([], "test@gmail.com");
        expect(result).toBeNull();
    });

    test("should find the correct user among multiple users", () => {
        const result = findUserPreference(allPrefs, "john@gmail.com");
        expect(result.preference).toBe("Vegan");
        expect(result.allergies).toEqual(["Gluten", "Dairy"]);
    });

    test("should return user with empty allergies array", () => {
        const result = findUserPreference(allPrefs, "sarah@gmail.com");
        expect(result.preference).toBe("Keto");
        expect(result.allergies).toEqual([]);
    });

});

// ==================== updateUserPreferences ====================
describe('Profile Management - updateUserPreferences', () => {

    // --- Adding new users ---

    test("should add preferences for a new user to an empty array", () => {
        const allPrefs = [];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Liquid", ["Peanuts"]);

        expect(result.length).toBe(1);
        expect(result[0].username).toBe("test@gmail.com");
        expect(result[0].preference).toBe("Liquid");
        expect(result[0].allergies).toEqual(["Peanuts"]);
    });

    test("should add a new user without affecting existing users", () => {
        const allPrefs = [
            { username: "existing@gmail.com", preference: "Vegan", allergies: ["Dairy"] }
        ];
        const result = updateUserPreferences(allPrefs, "newuser@gmail.com", "Keto", ["Gluten"]);

        expect(result.length).toBe(2);
        expect(result[0].username).toBe("existing@gmail.com");
        expect(result[0].preference).toBe("Vegan");
        expect(result[1].username).toBe("newuser@gmail.com");
        expect(result[1].preference).toBe("Keto");
    });

    test("should add a user with no allergies", () => {
        const allPrefs = [];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Vegan", []);

        expect(result.length).toBe(1);
        expect(result[0].allergies).toEqual([]);
    });

    test("should add a user with multiple allergies", () => {
        const allPrefs = [];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Keto", ["Peanuts", "Gluten", "Dairy", "Shellfish"]);

        expect(result.length).toBe(1);
        expect(result[0].allergies).toEqual(["Peanuts", "Gluten", "Dairy", "Shellfish"]);
        expect(result[0].allergies.length).toBe(4);
    });

    // --- Updating existing users ---

    test("should update preference for an existing user", () => {
        const allPrefs = [
            { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts"] }
        ];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Vegan", ["Peanuts"]);

        expect(result.length).toBe(1);
        expect(result[0].preference).toBe("Vegan");
    });

    test("should update allergies for an existing user", () => {
        const allPrefs = [
            { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts"] }
        ];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Liquid", ["Gluten", "Dairy"]);

        expect(result.length).toBe(1);
        expect(result[0].allergies).toEqual(["Gluten", "Dairy"]);
    });

    test("should update both preference and allergies at the same time", () => {
        const allPrefs = [
            { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts"] }
        ];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Keto", ["Shellfish", "Soy"]);

        expect(result.length).toBe(1);
        expect(result[0].preference).toBe("Keto");
        expect(result[0].allergies).toEqual(["Shellfish", "Soy"]);
    });

    test("should clear allergies when updated with empty array", () => {
        const allPrefs = [
            { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts", "Gluten"] }
        ];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Liquid", []);

        expect(result[0].allergies).toEqual([]);
    });

    // --- No duplicates ---

    test("should not create a duplicate entry when updating", () => {
        const allPrefs = [
            { username: "test@gmail.com", preference: "Liquid", allergies: ["Peanuts"] }
        ];
        const result = updateUserPreferences(allPrefs, "test@gmail.com", "Vegan", ["Dairy"]);   // update existing user

        const matches = result.filter(p => p.username === "test@gmail.com");
        expect(matches.length).toBe(1);
    });

    // --- Multiple users ---

    test("should not affect other users when updating one user", () => {
        const allPrefs = [
            { username: "user1@gmail.com", preference: "Keto", allergies: ["Nuts"] },
            { username: "user2@gmail.com", preference: "Vegan", allergies: [] },
            { username: "user3@gmail.com", preference: "Liquid", allergies: ["Dairy"] }
        ];
        const result = updateUserPreferences(allPrefs, "user2@gmail.com", "Paleo", ["Soy"]);

        expect(result.length).toBe(3);
        expect(result[0].preference).toBe("Keto");       // user1 unchanged
        expect(result[1].preference).toBe("Paleo");      // user2 updated
        expect(result[2].preference).toBe("Liquid");     // user3 unchanged
    });

    test("should handle updating the last user in the array", () => {
        const allPrefs = [
            { username: "user1@gmail.com", preference: "Keto", allergies: [] },
            { username: "user2@gmail.com", preference: "Vegan", allergies: ["Dairy"] }
        ];
        const result = updateUserPreferences(allPrefs, "user2@gmail.com", "Mediterranean", ["Gluten"]);

        expect(result[1].preference).toBe("Mediterranean");
        expect(result[1].allergies).toEqual(["Gluten"]);
    });

    test("should handle updating the first user in the array", () => {
        const allPrefs = [
            { username: "user1@gmail.com", preference: "Keto", allergies: [] },
            { username: "user2@gmail.com", preference: "Vegan", allergies: ["Dairy"] }
        ];
        const result = updateUserPreferences(allPrefs, "user1@gmail.com", "Carnivore", ["Soy", "Wheat"]);

        expect(result[0].preference).toBe("Carnivore");
        expect(result[0].allergies).toEqual(["Soy", "Wheat"]);
        expect(result[1].preference).toBe("Vegan"); // user2 unchanged
    });

});

// ==================== GET /profile ====================
describe('Profile Management - GET /profile', () => {

    test("should redirect to /login if user is not authenticated", async () => {
        const res = await request(app).get('/profile');
        expect(res.status).toBe(302);               // 302 = redirect
        expect(res.headers.location).toBe('/login'); // redirects to login page
    });

    test("should return 200 and render profile page when user is authenticated", async () => {
        const agent = request.agent(app);   // agent persists cookies/session across requests

        // Register a test user
        await agent.post('/register').send({
            username: "profileTestUser1",
            password: "testpass1",
            confirmPassword: "testpass1"
        });

        // Login with the test user
        await agent.post('/login').send({
            username: "profileTestUser1",
            password: "testpass1"
        });

        // Now GET /profile should work (200 = OK, page rendered)
        const res = await agent.get('/profile');
        expect(res.status).toBe(200);
    });

});

// ==================== POST /api/save-profile ====================
describe('Profile Management - POST /api/save-profile', () => {

    // Back up original preferences before all tests, restore after all tests
    let originalPrefs;

    beforeEach(() => {
        originalPrefs = fs.readFileSync(PREFERENCES_FILE, 'utf8');
    });

    afterEach(() => {
        fs.writeFileSync(PREFERENCES_FILE, originalPrefs); // restore original data
    });

    test("should redirect to /login if user is not authenticated", async () => {
        const res = await request(app)
            .post('/api/save-profile')
            .send({ preference: "Vegan", allergies: ["Peanuts"] });

        expect(res.status).toBe(302);               // 302 = redirect
        expect(res.headers.location).toBe('/login'); // redirects to login page
    });

    test("should return success JSON when authenticated user saves preferences", async () => {
        const agent = request.agent(app);   // agent persists cookies/session across requests

        // Register a test user
        await agent.post('/register').send({
            username: "profileTestUser2",
            password: "testpass1",
            confirmPassword: "testpass1"
        });

        // Login
        await agent.post('/login').send({
            username: "profileTestUser2",
            password: "testpass1"
        });

        // Save preferences
        const res = await agent
            .post('/api/save-profile')
            .send({ preference: "Vegan", allergies: ["Peanuts", "Dairy"] });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe("success");
    });

    test("should persist saved preferences to preferences.json", async () => {
        const agent = request.agent(app);

        // Register and login
        await agent.post('/register').send({
            username: "profileTestUser3",
            password: "testpass1",
            confirmPassword: "testpass1"
        });
        await agent.post('/login').send({
            username: "profileTestUser3",
            password: "testpass1"
        });

        // Save preferences
        await agent
            .post('/api/save-profile')
            .send({ preference: "Keto", allergies: ["Gluten"] });

        // Read the file and verify the data was saved
        const allPrefs = JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf8'));
        const savedPref = allPrefs.find(p => p.username === "profileTestUser3");

        expect(savedPref).toBeDefined();
        expect(savedPref.preference).toBe("Keto");
        expect(savedPref.allergies).toEqual(["Gluten"]);
    });

});

// Clean up test users from users.json after each tests
afterEach(() => {
    const USERS_FILE = path.join(__dirname, '../../data/users.json');
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    const cleaned = users.filter(u => !u.username.startsWith("profileTestUser"));
    fs.writeFileSync(USERS_FILE, JSON.stringify(cleaned, null, 2));
});