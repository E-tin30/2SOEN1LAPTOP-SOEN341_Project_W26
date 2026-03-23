const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../../server.js");
const { validateCredentials, isDuplicate } = require('../../routes/authRoutes');    // import the functions to test

const USERS_FILE_PATH = path.join(__dirname, "../../data/users.json");

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

describe("Registration - validateCredentials", () => {

  test("should return null for valid credentials", () => {  // valid username, password, and matching confirm password
    const result = validateCredentials("martin", "hello1", "hello1");
    expect(result).toBeNull();  // if valid then returns null, otherwise returns an error message
  });

  test("should return error when fields are missing", () => {   // ! empty username, password, or confirm password should return an error message
    const result = validateCredentials("", "hello1", "hello1");
    expect(result).toBe("All fields are required.");
  });

  test("should return error when passwords don't match", () => {    // if password and confirm password don't match then return an error message
    const result = validateCredentials("martin", "hello1", "hello2");
    expect(result).toBe("Passwords do not match."); // if password and confirm password don't match then return this error message
  });

  test("should return error when password has no digit", () => {    // password must contain at least one digit, if not return an error message
    const result = validateCredentials("martin", "helloworld", "helloworld");
    expect(result).toBe("Password rules were not followed.");
  });

  test("should return error when password is too short", () => {    // password must be at least 5 characters long, if not return an error message
    const result = validateCredentials("martin", "hi1", "hi1"); // password is only 3 characters long, so it should return an error message
    expect(result).toBe("Password rules were not followed.");
  });

});

// Testing for duplicate username
describe("Registration - isDuplicate", () => {

    // existingUsers array to test against
  const existingUsers = [
    { username: "martin" },
    { username: "JohnDoe" }
  ];

  // if the username "martin" already exists in the existingUsers array, then it should return true
  test("should return true if username already exists", () => {
    const result = isDuplicate(existingUsers, "martin");   
    expect(result).toBe(true);
  });

  // if the username "MARTIN" already exists in the existingUsers array (case-insensitive), then it should return true
  test("should return true for duplicate with different capitalization", () => {
    const result = isDuplicate(existingUsers, "MARTIN");    // if the username "MARTIN" already exists in the existingUsers array (case-insensitive), then it should return true
    expect(result).toBe(true);
  });
  
  // if the username "newuser" does not exist in the existingUsers array, then it should return false
  test("should return false if username is new", () => {
    const result = isDuplicate(existingUsers, "newuser");
    expect(result).toBe(false);
  });

});

// ==================== GET /register ====================
describe("Registration - GET /register", () => {

  test("should return 200 and render the register page", async () => {
    const res = await request(app).get('/register');
    expect(res.status).toBe(200);   // 200 = OK, page rendered
  });

});

// ==================== POST /register ====================
describe("Registration - POST /register", () => {

  // Back up original users before each tests, restore after each tests
  let originalUsers;

  beforeEach(() => {
    originalUsers = fs.readFileSync(USERS_FILE_PATH, 'utf8');
  });

  afterEach(() => {
    fs.writeFileSync(USERS_FILE_PATH, originalUsers);  // restore original users data
  });

  test("should redirect to /register when fields are missing", async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: "", password: "hello1", confirmPassword: "hello1" });

    expect(res.status).toBe(302);                   // 302 = redirect
    expect(res.headers.location).toBe('/register');  // redirects back to register page
  });

  test("should redirect to /register when passwords don't match", async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: "testUser", password: "hello1", confirmPassword: "hello2" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/register');
  });

  test("should redirect to /register when password rules are not followed", async () => {
    const res = await request(app)
      .post('/register')
      .send({ username: "testUser", password: "hi", confirmPassword: "hi" });   // too short, no digit

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/register');
  });

 

  test("should save the new user to users.json after registration", async () => {
    await request(app)
      .post('/register')
      .send({ username: "regTestUser2", password: "testpass1", confirmPassword: "testpass1" });

    // Read the file and verify the user was saved
    const users = JSON.parse(fs.readFileSync(USERS_FILE_PATH, 'utf8'));
    const newUser = users.find(u => u.username === "regTestUser2");

    expect(res.status).toBe(302); // redirect
    expect(res.headers.location).toBe('/login'); // redirect to login
    expect(newUser).toBeDefined();                  // user exists in file
    expect(newUser.password).not.toBe("testpass1"); // password should be hashed, not plain text
  });

  test("should redirect to /register if username already exists", async () => {
    // Register first time
    await request(app)
      .post('/register')
      .send({ username: "regTestUser3", password: "testpass1", confirmPassword: "testpass1" });

    // Try registering again with the same username
    const res = await request(app)
      .post('/register')
      .send({ username: "regTestUser3", password: "testpass1", confirmPassword: "testpass1" });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/register');  // duplicate username redirects back
  });

});