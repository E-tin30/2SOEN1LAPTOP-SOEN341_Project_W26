const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../server.js");

const RECIPES_FILE_PATH = path.join(__dirname, "../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../data/users.json");
const PREFERENCES_FILE_PATH = path.join(__dirname, "../data/preferences.json");

