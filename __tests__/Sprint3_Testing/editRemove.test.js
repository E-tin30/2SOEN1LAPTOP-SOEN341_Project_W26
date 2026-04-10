// ! US Edit or remove meals from the weekly planner

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
  await agent.post("/register").send({ username: "edituser@gmail.com", password: "test12345", confirmPassword: "test12345" });
  await agent.post("/login").send({ username: "edituser@gmail.com", password: "test12345" });
  return agent;
}

function seedWithMeal() {
  fs.writeFileSync(RECIPES_FILE, JSON.stringify([
    { id: 1, username: "edituser@gmail.com", 
        name: "Pasta", ingredients: ["pasta"], 
        time: "20 mins", 
        Steps: "Boil", 
        cost: "$8", 
        tags: "dinner", 
        difficulty: "easy" 
    },
    { id: 2, 
        username: "edituser@gmail.com", 
        name: "Salad", ingredients: ["lettuce"], 
        time: "5 mins", 
        Steps: "Toss", 
        cost: "$4", 
        tags: "lunch", 
        difficulty: "easy" 
    },
  ], null, 2));
  fs.writeFileSync(MEALPLAN_FILE, JSON.stringify([
    { username: "edituser@gmail.com", meals: [{ name: "Pasta", date: "2026-04-08", startTime: "18:00", endTime: "19:00" }] }
  ], null, 2));
}

/* ── UNIT – Edit meal ── */

describe("Unit – POST /mealPlanner/edit", () => {
  test("Edit a meal's time slot successfully", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "2026-04-08", startTime: "19:00", endTime: "20:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    const meal = plans[0].meals[0];
    expect(meal.startTime).toBe("19:00");
    expect(meal.endTime).toBe("20:00");
  });

  test("Edit a meal's recipe", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Salad", date: "2026-04-08", startTime: "18:00", endTime: "19:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals[0].name).toBe("Salad");
  });

  test("Edit a meal's date (move to another day)", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "2026-04-09", startTime: "18:00", endTime: "19:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals[0].date).toBe("2026-04-09");
  });

  test("Edit with missing fields returns validation error", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "", startTime: "18:00", endTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Validation Failed");
  });

  test("Edit with start >= end returns validation error", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "2026-04-08", startTime: "20:00", endTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Start time must be before End time");
  });

  test("Edit non-existent meal returns error", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Ghost", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "2026-04-08", startTime: "18:00", endTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Meal not found");
  });
});

/* ── UNIT – Delete meal ── */

describe("Unit – POST /mealPlanner/delete", () => {
  test("Delete a meal removes it from the plan", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/delete").send({
      mealName: "Pasta", mealDate: "2026-04-08", mealStartTime: "18:00", mealEndTime: "19:00",
    });

    const plans = JSON.parse(fs.readFileSync(MEALPLAN_FILE, "utf8"));
    expect(plans[0].meals.length).toBe(0);
  });

  test("Delete with missing fields returns validation error", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/delete").send({ mealName: "Pasta" });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Validation Failed");
  });

  test("Delete non-existent meal returns error", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/delete").send({
      mealName: "Ghost", mealDate: "2026-04-08", mealStartTime: "18:00", mealEndTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Meal not found");
  });
});

/* ── INTEGRATION – Edit & remove flow ── */

describe("Integration – Edit and remove meals from the planner", () => {
  test("Add → Edit → verify updated meal on page", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    // Edit: change time
    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Pasta", date: "2026-04-08", startTime: "20:00", endTime: "21:00",
    });

    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.text).toContain("20:00 - 21:00");
    expect(page.text).not.toContain("18:00 - 19:00");
  });

  test("Add → Delete → meal no longer on page", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/delete").send({
      mealName: "Pasta", mealDate: "2026-04-08", mealStartTime: "18:00", mealEndTime: "19:00",
    });

    const page = await agent.get("/mealPlanner?week=2026-04-08");
    expect(page.text).not.toContain('class="RecipeName">Pasta</div>');
  });

  test("Edit shows success flash message", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/edit").send({
      originalName: "Pasta", originalDate: "2026-04-08", originalStartTime: "18:00", originalEndTime: "19:00",
      recipeID: "Salad", date: "2026-04-08", startTime: "12:00", endTime: "13:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Meal updated successfully");
  });

  test("Delete shows success flash message", async () => {
    const agent = await loginAgent();
    seedWithMeal();

    await agent.post("/mealPlanner/delete").send({
      mealName: "Pasta", mealDate: "2026-04-08", mealStartTime: "18:00", mealEndTime: "19:00",
    });

    const page = await agent.get("/mealPlanner");
    expect(page.text).toContain("Meal deleted successfully");
  });
});
