// ! Assign recipes to a specific day and meal type

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
    username: "assigntest@gmail.com",
    password: "test12345",
    confirmPassword: "test12345",
  });

  const loginRes = await agent.post("/login").send({
    username: "assigntest@gmail.com",
    password: "test12345",
  });

  expect(loginRes.statusCode).toBe(302);
  return agent;
}

// Helper: seed recipes for the test user
function seedRecipes() {
  const recipes = [
    {
      id: 1,
      username: "assigntest@gmail.com",
      name: "Pancakes",
      ingredients: ["flour", "eggs", "milk"],
      time: "15 mins",
      Steps: "Mix and fry",
      cost: "$4",
      tags: "breakfast",
      difficulty: "easy",
    },
    {
      id: 2,
      username: "assigntest@gmail.com",
      name: "Grilled Chicken Salad",
      ingredients: ["chicken", "lettuce", "tomato"],
      time: "25 mins",
      Steps: "Grill and toss",
      cost: "$10",
      tags: "lunch",
      difficulty: "medium",
    },
    {
      id: 3,
      username: "assigntest@gmail.com",
      name: "Spaghetti Bolognese",
      ingredients: ["pasta", "ground beef", "tomato sauce"],
      time: "30 mins",
      Steps: "Boil and simmer",
      cost: "$12",
      tags: "dinner",
      difficulty: "medium",
    },
  ];
  fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));
}

/* ────────────────────────────────────────────
   UNIT TESTS – Assigning a recipe to a day/slot
   ──────────────────────────────────────────── */

describe("Unit – Assign recipe to a specific day and time slot", () => {
  test("Recipe is assigned to the correct date", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-06", // Sunday
      startTime: "08:00",
      endTime: "09:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    expect(userPlan.meals.length).toBe(1);
    expect(userPlan.meals[0].date).toBe("2026-04-06");
    expect(userPlan.meals[0].name).toBe("Pancakes");
  });

  test("Recipe is assigned with the correct start and end time", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Grilled Chicken Salad",
      date: "2026-04-07", // Monday
      startTime: "12:00",
      endTime: "13:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    expect(userPlan.meals[0].startTime).toBe("12:00");
    expect(userPlan.meals[0].endTime).toBe("13:00");
  });

  test("Different recipes can be assigned to different days", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // Breakfast on Sunday
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-06",
      startTime: "08:00",
      endTime: "09:00",
    });

    // Lunch on Monday
    await agent.post("/mealPlanner").send({
      recipeID: "Grilled Chicken Salad",
      date: "2026-04-07",
      startTime: "12:00",
      endTime: "13:00",
    });

    // Dinner on Tuesday
    await agent.post("/mealPlanner").send({
      recipeID: "Spaghetti Bolognese",
      date: "2026-04-08",
      startTime: "18:00",
      endTime: "19:30",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    expect(userPlan.meals.length).toBe(3);

    const names = userPlan.meals.map((m) => m.name);
    expect(names).toContain("Pancakes");
    expect(names).toContain("Grilled Chicken Salad");
    expect(names).toContain("Spaghetti Bolognese");
  });

  test("Multiple recipes can be assigned to the same day at different times", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // Morning slot
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08",
      startTime: "08:00",
      endTime: "09:00",
    });

    // Lunch slot (no overlap)
    await agent.post("/mealPlanner").send({
      recipeID: "Grilled Chicken Salad",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    // Dinner slot (no overlap)
    await agent.post("/mealPlanner").send({
      recipeID: "Spaghetti Bolognese",
      date: "2026-04-08",
      startTime: "18:00",
      endTime: "19:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    expect(userPlan.meals.length).toBe(3);
  });

  test("Meals are stored in sorted order (date then time)", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // Add dinner first
    await agent.post("/mealPlanner").send({
      recipeID: "Spaghetti Bolognese",
      date: "2026-04-08",
      startTime: "18:00",
      endTime: "19:00",
    });

    // Add breakfast second (earlier time, same day)
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08",
      startTime: "08:00",
      endTime: "09:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    // Breakfast should come before dinner even though it was added second
    expect(userPlan.meals[0].name).toBe("Pancakes");
    expect(userPlan.meals[1].name).toBe("Spaghetti Bolognese");
  });

  test("Time conflict on the same day is rejected", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // First meal 12:00–13:00
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    // Overlapping meal 12:30–13:30
    await agent.post("/mealPlanner").send({
      recipeID: "Grilled Chicken Salad",
      date: "2026-04-08",
      startTime: "12:30",
      endTime: "13:30",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Time conflict with another meal");

    // Only the first meal should be saved
    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");
    expect(userPlan.meals.length).toBe(1);
  });

  test("Adjacent time slots (no overlap) are allowed", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // First meal ends at 13:00
    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08",
      startTime: "12:00",
      endTime: "13:00",
    });

    // Second meal starts at 13:00 (no overlap, back-to-back)
    await agent.post("/mealPlanner").send({
      recipeID: "Grilled Chicken Salad",
      date: "2026-04-08",
      startTime: "13:00",
      endTime: "14:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");
    expect(userPlan.meals.length).toBe(2);
  });

  test("Only the logged-in user's recipes appear in the planner dropdown", async () => {
    const agent = await createAuthenticatedAgent();

    // Seed a recipe for a different user
    const recipes = [
      {
        id: 1,
        username: "otheruser@gmail.com",
        name: "Other User Recipe",
        ingredients: ["stuff"],
        time: "10 mins",
        Steps: "Do things",
        cost: "$5",
        tags: "other",
        difficulty: "easy",
      },
      {
        id: 2,
        username: "assigntest@gmail.com",
        name: "My Recipe",
        ingredients: ["eggs"],
        time: "5 mins",
        Steps: "Cook",
        cost: "$3",
        tags: "mine",
        difficulty: "easy",
      },
    ];
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(recipes, null, 2));

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("My Recipe");
    expect(page.text).not.toContain("Other User Recipe");
  });
});



describe("Integration – Assign recipes to days and verify planner display", () => {
  test("Login → select day → choose recipe → planner updates with the meal", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // Assign a recipe to Wednesday
    const postRes = await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08", // Wednesday
      startTime: "08:00",
      endTime: "09:00",
    });
    expect(postRes.statusCode).toBe(302);

    // Load the planner for that week and verify the meal block is rendered
    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.statusCode).toBe(200);
    expect(page.text).toContain('class="RecipeName">Pancakes</div>');
    expect(page.text).toContain("08:00 - 09:00");
  });

  test("Assign recipes across a full week and verify all appear", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    // Sunday, Monday, Tuesday – one recipe each
    const assignments = [
      { recipeID: "Pancakes", date: "2026-04-05", startTime: "08:00", endTime: "09:00" },
      { recipeID: "Grilled Chicken Salad", date: "2026-04-06", startTime: "12:00", endTime: "13:00" },
      { recipeID: "Spaghetti Bolognese", date: "2026-04-07", startTime: "18:00", endTime: "19:30" },
    ];

    for (const meal of assignments) {
      await agent.post("/mealPlanner").send(meal);
    }

    const page = await agent.get("/mealPlanner?week=2026-04-05");
    expect(page.text).toContain('class="RecipeName">Pancakes</div>');
    expect(page.text).toContain('class="RecipeName">Grilled Chicken Salad</div>');
    expect(page.text).toContain('class="RecipeName">Spaghetti Bolognese</div>');
  });

  test("Assigning a recipe persists and survives page reload", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-08",
      startTime: "07:00",
      endTime: "08:00",
    });

    // First load
    const page1 = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page1.text).toContain('class="RecipeName">Pancakes</div>');

    // "Reload" – second GET
    const page2 = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page2.text).toContain('class="RecipeName">Pancakes</div>');
  });

  test("Data file reflects the correct day-to-recipe mapping", async () => {
    const agent = await createAuthenticatedAgent();
    seedRecipes();

    await agent.post("/mealPlanner").send({
      recipeID: "Pancakes",
      date: "2026-04-06", // Sunday
      startTime: "08:00",
      endTime: "09:00",
    });

    await agent.post("/mealPlanner").send({
      recipeID: "Spaghetti Bolognese",
      date: "2026-04-10", // Thursday
      startTime: "19:00",
      endTime: "20:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const userPlan = plans.find((p) => p.username === "assigntest@gmail.com");

    // Sunday meal
    const sundayMeal = userPlan.meals.find((m) => m.date === "2026-04-06");
    expect(sundayMeal).toBeDefined();
    expect(sundayMeal.name).toBe("Pancakes");

    // Thursday meal
    const thursdayMeal = userPlan.meals.find((m) => m.date === "2026-04-10");
    expect(thursdayMeal).toBeDefined();
    expect(thursdayMeal.name).toBe("Spaghetti Bolognese");
  });

  test("Other user's assigned meals do not appear in current user's planner", async () => {
    // Pre-seed a meal for a different user
    const otherPlan = [
      {
        username: "otheruser@gmail.com",
        meals: [
          { name: "Secret Recipe", date: "2026-04-08", startTime: "12:00", endTime: "13:00" },
        ],
      },
    ];
    fs.writeFileSync(MEALPLAN_FILE, JSON.stringify(otherPlan, null, 2));

    const agent = await createAuthenticatedAgent();

    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.text).not.toContain('class="RecipeName">Secret Recipe</div>');
  });
});