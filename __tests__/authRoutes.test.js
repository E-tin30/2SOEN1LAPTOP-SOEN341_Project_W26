const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../server.js");

const RECIPES_FILE_PATH = path.join(__dirname, "../data/recipes.json");
const USERS_FILE_PATH = path.join(__dirname, "../data/users.json");
const PREFERENCES_FILE_PATH = path.join(__dirname, "../data/preferences.json");

describe("Login Route Testing", () => {

    test("GET /login returns page", async () => {
        const res = await request(app).get("/login");
        expect(res.statusCode).toBe(200);
    });

    test("GET / returns home page if logged in", async () => {
        const agent = request.agent(app); // create agent
        const login = await agent.post("/login").send({ 
            username: "test@gmail.com",
            password: "test12345"
        }); // simulate agent logging in (using user+password from users.json)

        expect(login.statusCode).toBe(302); // make sure agent is redirected on successful login
        expect(login.headers.location).toBe("/"); // make sure agent is redirect to home page

        const res = await agent.get("/"); // try and access "/" after logging in
        expect(res.statusCode).toBe(200); // check that agent was able to get to home page
    });

    test("GET / redirect to login page if not logged in", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(302); // 302 = redirect
        expect(res.headers.location).toBe("/login"); // make sure redirected to /login
    });

    test("POST /login fails with invalid credentials", async () => {
    const res = await request(app).post("/login").send({
        username: "wrong@gmail.com",
        password: "wrongpassword"
    }); // try to log in with invalid credentials

    expect(res.statusCode).toBe(302); // should be redirected back to login page when login fails
    expect(res.headers.location).toBe("/login");
});

});

describe("Logout Route Testing", () => {

    test("POST /logout ends session and logs out user", async() => {
        const agent = request.agent(app); // create agent

        await agent.post("/login").send({ 
            username: "test@gmail.com",
            password: "test12345"
        }); // simulate agent logging in (using user+password from users.json)

        const logout = await agent.post("/logout");

        expect(logout.statusCode).toBe(302); // make sure agent is redirected on successful logout
        expect(logout.headers.location).toBe("/login"); // make sure agent is redirect to login page

        const res = await agent.get("/"); // try to access homepage

        expect(res.statusCode).toBe(302); // should be redirected since no longer logged in
        expect(res.headers.location).toBe("/login"); // should be redirected to login page
    });

});

describe("Auth Helper Function Testing", () => {

    test("validateCredentials works with good inputs", () => {
        
    });

});