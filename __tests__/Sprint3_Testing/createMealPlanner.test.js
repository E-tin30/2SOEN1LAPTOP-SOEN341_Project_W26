// ! US create weekly meal plan

const fs = require("fs");
const path = require("path");
const request = require("supertest");
const app = require("../../server.js");

const MEALPLAN_FILE = path.join(__dirname, "../../data/mealPlans.json");
const RECIPES_FILE = path.join(__dirname, "../../data/recipes.json");
const USERS_FILE = path.join(__dirname, "../../data/users.json");

const originalMealPlans = fs.readFileSync(MEALPLAN_FILE, "utf8");
const originalRecipes = fs.readFileSync(RECIPES_FILE, "utf8");
const originalUsers = fs.readFileSync(USERS_FILE, "utf8");

beforeEach(() => {
  fs.writeFileSync(MEALPLAN_FILE, "[]");
  fs.writeFileSync(RECIPES_FILE, "[]");
  fs.writeFileSync(USERS_FILE, "[]");
});

afterAll(() => {
  fs.writeFileSync(MEALPLAN_FILE, originalMealPlans);
  fs.writeFileSync(RECIPES_FILE, originalRecipes);
  fs.writeFileSync(USERS_FILE, originalUsers);
});

// Helper: register + login and return an authenticated agent
async function createAuthenticatedAgent() {
  const agent = request.agent(app);

  await agent.post("/register").send({
    username: "mealtest@gmail.com",
    password: "test12345",
    confirmPassword: "test12345",
  });

  const loginRes = await agent.post("/login").send({
    username: "mealtest@gmail.com",
    password: "test12345",
  });

  expect(loginRes.statusCode).toBe(302);
  return agent;
}

// Helper: seed a recipe for the test user so it can be assigned to a meal
function seedRecipe() {
  const recipes = [
    {
      id: 1,
      username: "mealtest@gmail.com",
      name: "Test Recipe",
      ingredients: ["egg", "milk"],
      time: "10 mins",
      Steps: "Cook it",
      cost: "$5",
      tags: "quick",
      difficulty: "easy",
    },
  ];
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
}

/* ────────────────────────────────────────────
   UNIT TESTS
   ──────────────────────────────────────────── */

describe("Unit – GET /mealPlanner (access & empty grid)", () => {
    // Note: we have separate test cases for auth and query param handling, 
    // but here we just want to verify the basic page access and empty state for a new user
  test("Unauthenticated user is redirected to /login", async () => {
    const res = await request(app).get("/mealPlanner");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Authenticated user can access the meal planner page", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/mealPlanner");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Meal Planner");
  });

  test("New user sees an empty planner (no meals)", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/mealPlanner");
    expect(res.statusCode).toBe(200);

    // The meal plans file should still be empty for this user
    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "mealtest@gmail.com");
    expect(userPlan).toBeUndefined();
  });

  test("Planner page accepts a ?week= query parameter", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/mealPlanner?week=2026-04-06");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Meal Planner");
  });

  test("Invalid ?week= value redirects back to /mealPlanner", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.get("/mealPlanner?week=invalid-date");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/mealPlanner");
  });
});

describe("Unit – POST /mealPlanner (create a meal entry)", () => {
  test("Creating a meal with valid data redirects to /mealPlanner", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    const res = await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/mealPlanner");
  });

  test("Meal is persisted in the JSON file after creation", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "mealtest@gmail.com");

    expect(userPlan).toBeDefined();
    expect(userPlan.meals.length).toBe(1);
    expect(userPlan.meals[0]).toMatchObject({
      name: "Test Recipe",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });
  });

  test("Missing fields triggers a validation error", async () => {
    const agent = await createAuthenticatedAgent();

    const res = await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      // date is missing
      startTime: "12:00",
      endTime: "13:00",
    });

    expect(res.statusCode).toBe(302);

    // Follow redirect and check for flash error
    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Validation Failed");
  });

  test("Selecting 'none' as recipeID triggers a validation error", async () => {
    const agent = await createAuthenticatedAgent();

    await agent.post("/mealPlanner").send({
      recipeID: "none",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Validation Failed");
  });

  test("Start time >= end time triggers a validation error", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "14:00",
      endTime: "13:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Start time must be before End time");
  });

  test("Meal exceeding 3 hours triggers a validation error", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "08:00",
      endTime: "12:00", // 4 hours
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Meal cannot exceed 3 hours");
  });
});

/* ────────────────────────────────────────────
   INTEGRATION TESTS
   ──────────────────────────────────────────── */

describe("Integration – Full weekly meal plan creation flow", () => {
  test("Register → Login → View empty planner → Add meal → Verify on page", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    // Step 1: Navigate to the planner and see empty state
    const emptyPage = await agent.get("/mealPlanner");
    expect(emptyPage.statusCode).toBe(200);

    // Step 2: Create a meal entry
    const createRes = await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "18:00",
      endTime: "19:00",
    });
    expect(createRes.statusCode).toBe(302);

    // Step 3: Verify the meal shows up on the planner for that week
    const filledPage = await agent.get("/mealPlanner?week=2026-04-08");
    expect(filledPage.statusCode).toBe(200);
    expect(filledPage.text).toContain("Test Recipe");
  });

  test("Multiple meals can be added to different days in the same week", async () => {
    const agent = await createAuthenticatedAgent();

    // Seed two recipes
    const recipes = [
    {   id: 1, 
        username: "mealtest@gmail.com", 
        name: "Breakfast Bowl", 
        ingredients: ["oats"], 
        time: "5 mins", 
        Steps: "Mix", 
        cost: "$3", 
        tags: "morning", 
        difficulty: "easy" 
    },
    { 
        id: 2, 
        username: "mealtest@gmail.com", 
        name: "Pasta Dinner", 
        ingredients: ["pasta"], 
        time: "20 mins", 
        Steps: "Boil", 
        cost: "$8", 
        tags: "dinner", 
        difficulty: "medium" 
    },
    ];
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));

    // Add first meal (Wednesday Apr 8)
    await agent.post("/mealPlanner").send({
      recipeID: "Breakfast Bowl",
      date: "2026-04-08",
      startTime: "08:00",
      endTime: "08:30",
    });

    // Add second meal (Thursday Apr 9)
    await agent.post("/mealPlanner").send({
      recipeID: "Pasta Dinner",
      date: "2026-04-09",
      startTime: "19:00",
      endTime: "20:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "mealtest@gmail.com");

    expect(userPlan.meals.length).toBe(2);

    // Verify both appear on the page
    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.text).toContain("Breakfast Bowl");
    expect(page.text).toContain("Pasta Dinner");
  });

  test("Meals from a different week are NOT shown on the current week view", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    // Add a meal in a different week (Apr 15)
    await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-15",
      startTime: "12:00",
      endTime: "13:00",
    });

    // View the week of Apr 6–12 — the meal grid should NOT contain the recipe
    // (Note: recipe name also appears in the add-meal dropdown, so we check
    //  the grid-specific markup 'class="RecipeName"' instead of the whole page)
    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.text).not.toContain('class="RecipeName">Test Recipe</div>');
  });

  test("User plan is initialised on first meal creation (not before)", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipe();

    // Before any POST, no plan exists
    let plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans.length).toBe(0);

    // Create a meal
    await agent.post("/mealPlanner").send({
      recipeID: "Test Recipe",
      date: "2026-04-08",
      startTime: "10:00",
      endTime: "11:00",
    });

    // Now a plan should exist
    plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans.length).toBe(1);
    expect(plans[0].username).toBe("mealtest@gmail.com");
    expect(plans[0].meals.length).toBe(1);
  });
});