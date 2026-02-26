const fs = require("fs");
const path = require("path");

const RECIPES_FILE_PATH = path.join(__dirname, "../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../data/users.json");
const PREFERENCES_FILE_PATH = path.join(__dirname, "../data/preferences.json");

describe("System basic tests", () => {

    test("Server file exists", () => {
        expect(fs.existsSync("./server.js")).toBe(true); // check that server.js exists
    });

    test("Recipes file exists", () => {
        expect(fs.existsSync(RECIPES_FILE_PATH)).toBe(true); // check that recipe.json exists
    });

    test("User file exists", () => {
        expect(fs.existsSync(USERS_FILE_PATH)).toBe(true); // check that users.json exists
    });

    test("Preferences file exists", () => { 
        expect(fs.existsSync(PREFERENCES_FILE_PATH)).toBe(true); // check that preferences.json exists
    });

    test("Recipes JSON is valid", () => {
        const data = fs.readFileSync(RECIPES_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow(); // check that recipes.json is valid json file
    });

    test("Users JSON is valid", () => {
        const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow(); // check that users.json is valid json file
    });

    test("Preferences JSON is valid", () => {
        const data = fs.readFileSync(PREFERENCES_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow(); // check that preferences.json is valid json file
    });

});