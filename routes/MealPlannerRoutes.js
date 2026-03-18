const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');


/* MEALPLANNER JSON STRUCTURE */
// `__dirname` is `routes/`, so the JSON file lives one level up in `data/`
const MEALPLAN_FILE = path.join(__dirname , '..', 'data' , 'MealPlans.json');
const RECIPES_FILE = path.join(__dirname, '..', 'data', 'recipes.json');

function getMealPlans()
{
  if (!fs.existsSync(MEALPLAN_FILE))
  {
    return [];  // doesnt exist
  }
  return JSON.parse(fs.readFileSync(MEALPLAN_FILE , 'utf-8')) || [];
}

function SaveMealPlans(data)
{
  fs.writeFileSync(MEALPLAN_FILE,  JSON.stringify(data, null , 2));
}

function getRecipes() {
  if (!fs.existsSync(RECIPES_FILE)) {
    return [];
  }
  return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf-8')) || [];
}

function generateUniqueId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

// Showing the meal planner page
router.get('/meal-planner', requireAuth , (req, res) => {
  
  // Flash messages (mirrors `recipes` page behavior)
  const flashMessage = req.session.flashMessage;
  const flashError = req.session.flashError;
  delete req.session.flashMessage;
  delete req.session.flashError;

  const AllPlans = getMealPlans();
  const SpecificUserPlan = AllPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  
  
//*TESTING PURPOSES - HARDCODED MEAL PLAN TO SHOW HOW IT WORKS. THIS IS THE STRUCTURE THE MEAL PLANS MUST BE IN FOR THE FRONTEND TO RENDER IT CORRECTLY. THE REAL DATA WILL BE PULLED FROM MealPlans.json
  /*const testPlan = [
    {
      day: "Monday",
      meals: [
        { name: "Chicken Pasta", type: "Dinner", time: "7:00 PM" }
      ]
    },
    {
      day: "Friday",
      meals: [
        { name: "Steak Bowl", type: "Lunch", time: "12:30 PM" }
      ]
    }
  ];*/
  
  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    username: req.session.username,
    plan: //testPlan,
    SpecificUserPlan && Array.isArray(SpecificUserPlan.plan) ? SpecificUserPlan.plan : [], // pass the user's meal plan or an empty array if none exists
    recipes: getRecipes().filter(r => r.username === req.session.username), // recipes for "Add Meal" dropdown
    flashMessage,
    flashError
  });
});
// Handling the form submission from the meal planner page when user adds a recipe to a specific day
router.post('/meal-planner', requireAuth , (req, res) => {
  const { day, recipeId } = req.body;

  const allPlans = getMealPlans();

  let userPlan = allPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );

  if (!userPlan) {
    userPlan = { username: req.session.username, plan: [] };  // if not, create a new one for the user
    allPlans.push(userPlan);
  }

  if (!Array.isArray(userPlan.plan)) {
    userPlan.plan = [];
  }

  let dayEntry = userPlan.plan.find(d => d.day === day);  // find the specific day entry in the user's plan

  if (!dayEntry) {
    dayEntry = { day: day, meals: [] }; // if it doesn't exist, create it
    userPlan.plan.push(dayEntry); // add the new day entry to the user's plan
  }

  if (!Array.isArray(dayEntry.meals)) {
    dayEntry.meals = [];
  }

  const recipe = getRecipes().find(r => r.id === recipeId && r.username === req.session.username);
  if (!recipe) {
    req.session.flashError = "Recipe not found.";
    return res.redirect('/meal-planner');
  }

  // Avoid adding the exact same recipe twice on the same day.
  const alreadyAdded = (dayEntry.meals || []).some(
    m => m.name === recipe.name && m.time === (recipe.prepTime || "")
  );

  if (!alreadyAdded) {
    dayEntry.meals.push({
      id: generateUniqueId(),
      name: recipe.name,
      type: recipe.tag || "Meal",
      time: recipe.prepTime || ""
    });
  }

  SaveMealPlans(allPlans);
  req.session.flashMessage = alreadyAdded ? "Meal already exists for that day." : "Meal added successfully!";
  res.redirect('/meal-planner');
});

// Edit a meal in the user's plan
// Expects: day, mealIndex, name, type, time
router.put('/meal-planner', requireAuth, (req, res) => {
  const { day, mealIndex, name, type, time } = req.body;
  const idx = parseInt(mealIndex, 10);

  const allPlans = getMealPlans();
  const userPlan = allPlans.find(p => p.username === req.session.username);

  if (!userPlan || !Array.isArray(userPlan.plan)) {
    req.session.flashError = "Meal plan not found.";
    return res.redirect('/meal-planner');
  }

  const dayEntry = userPlan.plan.find(d => d.day === day);
  if (!dayEntry || !Array.isArray(dayEntry.meals)) {
    req.session.flashError = "Day entry not found.";
    return res.redirect('/meal-planner');
  }

  if (!Number.isFinite(idx) || idx < 0 || idx >= dayEntry.meals.length) {
    req.session.flashError = "Meal not found.";
    return res.redirect('/meal-planner');
  }

  const existing = dayEntry.meals[idx] || {};
  dayEntry.meals[idx] = {
    ...existing,
    name: (name || "").trim(),
    type: (type || "").trim(),
    time: (time || "").trim()
  };

  SaveMealPlans(allPlans);
  req.session.flashMessage = "Meal updated successfully!";
  res.redirect('/meal-planner');
});

// Delete a meal from the user's plan
// Expects: day, mealIndex
router.delete('/meal-planner', requireAuth, (req, res) => {
  const { day, mealIndex } = req.body;
  const idx = parseInt(mealIndex, 10);

  const allPlans = getMealPlans();
  const userPlan = allPlans.find(p => p.username === req.session.username);

  if (!userPlan || !Array.isArray(userPlan.plan)) {
    req.session.flashError = "Meal plan not found.";
    return res.redirect('/meal-planner');
  }

  const dayEntry = userPlan.plan.find(d => d.day === day);
  if (!dayEntry || !Array.isArray(dayEntry.meals)) {
    req.session.flashError = "Day entry not found.";
    return res.redirect('/meal-planner');
  }

  if (!Number.isFinite(idx) || idx < 0 || idx >= dayEntry.meals.length) {
    req.session.flashError = "Meal not found.";
    return res.redirect('/meal-planner');
  }

  dayEntry.meals.splice(idx, 1);
  SaveMealPlans(allPlans);
  req.session.flashMessage = "Meal deleted successfully!";
  res.redirect('/meal-planner');
});

module.exports = router;
/* END OF MEAL PLANNER LOGIC */