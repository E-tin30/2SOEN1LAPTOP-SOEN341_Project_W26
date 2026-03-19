const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../server.js");

const RECIPES_FILE_PATH = path.join(__dirname, "../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../data/users.json");
const PREFERENCES_FILE_PATH = path.join(__dirname, "../data/preferences.json");

describe("System basic tests", () => {

    test("Server file exists", () => {
        expect(fs.existsSync("./server.js")).toBe(true);
    });

    test("Recipes file exists", () => {
        expect(fs.existsSync(RECIPES_FILE_PATH)).toBe(true);
    });

    test("User file exists", () => {
        expect(fs.existsSync(USERS_FILE_PATH)).toBe(true);
    });

    test("Preferences file exists", () => {
        expect(fs.existsSync(PREFERENCES_FILE_PATH)).toBe(true);
    });

    test("Recipes JSON is valid", () => {
        const data = fs.readFileSync(RECIPES_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow();
    });

    test("Users JSON is valid", () => {
        const data = fs.readFileSync(USERS_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow();
    });

    test("Preferences JSON is valid", () => {
        const data = fs.readFileSync(PREFERENCES_FILE_PATH, "utf8");
        expect(() => JSON.parse(data)).not.toThrow();
    });

});