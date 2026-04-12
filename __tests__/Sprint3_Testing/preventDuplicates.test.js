// ! US Prevent duplicate meals within the same week

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

async function loginAgent() {
  const agent = request.agent(app);
  await agent.post("/register").send({ username: "duptest@gmail.com", password: "test12345", confirmPassword: "test12345" });
  await agent.post("/login").send({ username: "duptest@gmail.com", password: "test12345" });
  return agent;
}

function seedRecipes() {
  fs.writeFileSync(RECIPES_FILE, JSON.stringify([
    { id: 1, 
        username: "duptest@gmail.com", 
        name: "Pancakes", 
        ingredients: ["flour"], 
        time: "10 mins", 
        Steps: "Cook", 
        cost: "$4", 
        tags: "breakfast", 
        difficulty: "easy" },
    { id: 2, 
        username: "duptest@gmail.com", 
        name: "Salad", 
        ingredients: ["lettuce"], 
        time: "5 mins", 
        Steps: "Toss", 
        cost: "$3", 
        tags: "lunch", 
        difficulty: "easy" },
  ], null, 2));
}

/* ── UNIT – Duplicate detection on POST /mealPlanner ── */

describe("Unit – Duplicate recipe prevention", () => {
  test("Same recipe on a different day in the same week is rejected", async () => {
    const agent = await loginAgent();
    seedRecipes();

    // Monday
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-06", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    // Wednesday – same week, same recipe
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-08", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("already scheduled in this week");

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(1);
  });

  test("Same recipe on the same day and different time is still rejected", async () => {
    const agent = await loginAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-08", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-08", 
      startTime: "18:00", 
      endTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("already scheduled in this week");

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(1);
  });

  test("Same recipe in a different week is allowed", async () => {
    const agent = await loginAgent();
    seedRecipes();

    // Week of Apr 5–11
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-08", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    // Week of Apr 12–18
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-15", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(2);
  });

  test("Different recipes in the same week are allowed", async () => {
    const agent = await loginAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-06", 
      startTime: "08:00", 
      endTime: "09:00",
    });

    await agent.post("/mealPlanner").send({
      recipeID: "Salad", 
      date: "2026-04-07", 
      startTime: "12:00", 
      endTime: "13:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(2);
  });

  test("Time conflict on the same day is also rejected", async () => {
    const agent = await loginAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", 
      date: "2026-04-08", 
      startTime: "12:00", 
      endTime: "13:00",
    });

    await agent.post("/mealPlanner").send({
      recipeID: "Salad", 
      date: "2026-04-08", 
      startTime: "12:30", 
      endTime: "13:30",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Time conflict");

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(1);
  });
});

/* ── UNIT – Duplicate detection on POST /mealPlanner/edit ── */

describe("Unit – Duplicate prevention during edit", () => {
  test("Editing a meal to a recipe already scheduled that week is rejected", async () => {
    const agent = await loginAgent();
    seedRecipes();

    // Seed two meals in the same week
    fs.writeFileSync(MEALPLAN_FILE, JSON.stringify([{
      username: "duptest@gmail.com",
      meals: [
        {   name: "Pancakes", 
            date: "2026-04-06",
            startTime: "08:00", 
            endTime: "09:00" },
        { 
            name: "Salad", 
            date: "2026-04-07", 
            startTime: "12:00", 
            endTime: "13:00" 
        },
      ]
    }], null, 2));

    // Try to change Salad → Pancakes (duplicate)
    await agent.post("/mealPlanner/edit").send({
      originalName: "Salad", 
      originalDate: "2026-04-07", 
      originalStartTime: "12:00", 
      originalEndTime: "13:00",
      recipeID: "Pancakes", 
      date: "2026-04-07", 
      startTime: "12:00", 
      endTime: "13:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("already scheduled in this week");

    // Salad should remain unchanged
    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals[1].name).toBe("Salad");
  });
});

/* ── INTEGRATION – Full duplicate flow ── */

describe("Integration – Duplicate prevention end-to-end", () => {
  test("Add meal → attempt duplicate → error shown → planner unchanged", async () => {
    const agent = await loginAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", date: "2026-04-06", startTime: "08:00", endTime: "09:00",
    });

    // Attempt duplicate on another day same week
    const dupRes = await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", date: "2026-04-09", startTime: "08:00", endTime: "09:00",
    });
    expect(dupRes.statusCode).toBe(302);

    const page = await agent.get("/mealPlanner?week=2026-04-06");
    expect(page.text).toContain("already scheduled in this week");

    // Only one meal block on the page
    const mealBlocks = (page.text.match(/class="RecipeName">Pancakes<\/div>/g) || []);
    expect(mealBlocks.length).toBe(1);
  });

  test("Add two different recipes same week → both persist, no error", async () => {
    const agent = await loginAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes", date: "2026-04-06", startTime: "08:00", endTime: "09:00",
    });
    await agent.post("/mealPlanner").send({
      recipeID: "Salad", date: "2026-04-07", startTime: "12:00", endTime: "13:00",
    });

    const page = await agent.get("/mealPlanner?week=2026-04-06");
    expect(page.text).toContain('class="RecipeName">Pancakes</div>');
    expect(page.text).toContain('class="RecipeName">Salad</div>');
    expect(page.text).not.toContain("already scheduled");
  });
});