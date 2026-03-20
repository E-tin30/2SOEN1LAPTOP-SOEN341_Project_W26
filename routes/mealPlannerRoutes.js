const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

const MEALPLAN_FILE = path.join(__dirname , '../data/MealPlans.json');
const RECIPES_FILE = path.join(__dirname,'../data/recipes.json');

// Showing the meal planner page
router.get('/meal-planner', requireAuth , (req, res) => {

  const flashError = req.session.flashError;
  delete req.session.flashError;

  const flashMessage = req.session.flashMessage; // Grab the success message from the session
  delete req.session.flashMessage; // Clear it immediately so it disappears if the user refreshes the page

  const AllPlans = getMealPlans();
  let SpecificUserPlan = AllPlans.find(
    p => p.username === req.session.username
  );
  
  const recipeList = getRecipes();
  const userRecipes = recipeList.filter(r => r.username === req.session.username);

  if (!SpecificUserPlan) {
    SpecificUserPlan = {
      username: req.session.username,
      meals: []
    };
  }

  const selectedDate = req.query.week
  ? (() => {
      const [y, m, d] = req.query.week.split('-').map(Number);
      return new Date(y, m - 1, d); // local time, no timezone shift
    })()
  : new Date();

  if (isNaN(selectedDate.getTime())) {
    return res.redirect('/meal-planner'); // fall back to current week
  }

  let weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  weekStart.setHours(0,0,0,0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23,59,59,999);

  // filter meals
  const mealsForWeek = (SpecificUserPlan.meals || []).filter(meal => {
    const mealDate = new Date(meal.date + "T00:00:00");
    return mealDate >= weekStart && mealDate <= weekEnd;
  });

  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    recipes: userRecipes,
    username: req.session.username,
    meals: mealsForWeek,
    weekStart,
    flashError,
    flashMessage
  });
});


// Handling the form submission
router.post('/meal-planner', requireAuth , (req, res) => {
  const {recipeID,date,startTime,endTime} = req.body;

  if (!recipeID || recipeID === "none" || 
      !date || 
      !startTime || 
      !endTime) {
    req.session.flashError = "Validation Failed: Missing required fields.";
    return res.redirect('/meal-planner');
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    req.session.flashError = "Validation Failed: Start time must be before End time.";
    return res.redirect('/meal-planner');
  }

  const allPlans = getMealPlans();
  let userPlan = allPlans.find(p => p.username === req.session.username);

  if (!userPlan) {
    userPlan = { 
      username: req.session.username, 
      meals: []
    };
    allPlans.push(userPlan);
  }

  const selectedDate = new Date(date + "T00:00:00");

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const alreadyExists = userPlan.meals.some(meal => {
    if (meal.name !== recipeID) return false;

    const mealDate = new Date(meal.date + "T00:00:00");

    return mealDate >= weekStart && mealDate <= weekEnd;
  });

  if (alreadyExists) {
    req.session.flashError = "This recipe is already scheduled in this week.";
    return res.redirect('/meal-planner');
  }

  if (hasTimeConflict(userPlan.meals, { date, startTime, endTime })) {
    req.session.flashError = "Time conflict with another meal.";
    return res.redirect('/meal-planner');
  }

  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (duration > 180) {
    req.session.flashError = "Meal cannot exceed 3 hours.";
    return res.redirect('/meal-planner');
  }

  insertMealSorted(userPlan.meals, {
    name: recipeID, 
    date: date, 
    startTime: startTime, 
    endTime: endTime
  });

  SaveMealPlans(allPlans);

  res.redirect('/meal-planner');
});

// Edit a meal in the user's plan
router.post('/meal-planner/edit', requireAuth, (req, res) => {
  const { originalName, originalDate, originalStartTime, originalEndTime, recipeID, date, startTime, endTime } = req.body;

  if (!recipeID || recipeID === "none" || 
      !date || 
      !startTime || 
      !endTime) {
    req.session.flashError = "Validation Failed: Missing required fields.";
    return res.redirect('/meal-planner');
  }

  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    req.session.flashError = "Validation Failed: Start time must be before End time.";
    return res.redirect('/meal-planner');
  }

  const allPlans = getMealPlans();
  const userPlan = allPlans.find(p => p.username === req.session.username);

  if (!userPlan || !userPlan.meals) {
    req.session.flashError = "Meal plan not found.";
    return res.redirect('/meal-planner');
  }

  const mealIndex = userPlan.meals.findIndex(meal =>
    meal.name === originalName &&
    meal.date === originalDate &&
    meal.startTime === originalStartTime &&
    meal.endTime === originalEndTime
  );

  if (mealIndex === -1) {
    req.session.flashError = "Meal not found.";
    return res.redirect('/meal-planner');
  }

  const selectedDate = new Date(date + "T00:00:00");

  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Check for duplicate recipes in the week, excluding the current meal
  const otherMeals = userPlan.meals.filter((_, i) => i !== mealIndex);
  const alreadyExists = otherMeals.some(meal => {
    if (meal.name !== recipeID) return false;

    const mealDate = new Date(meal.date + "T00:00:00");

    return mealDate >= weekStart && mealDate <= weekEnd;
  });

  if (alreadyExists) {
    req.session.flashError = "This recipe is already scheduled in this week.";
    return res.redirect('/meal-planner');
  }

  // Check for conflicts, excluding the current meal
  if (hasTimeConflict(otherMeals, { date, startTime, endTime })) {
    req.session.flashError = "Time conflict with another meal.";
    return res.redirect('/meal-planner');
  }

  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (duration > 180) {
    req.session.flashError = "Meal cannot exceed 3 hours.";
    return res.redirect('/meal-planner');
  }

  // Update the meal
  userPlan.meals[mealIndex] = {
    name: recipeID,
    date: date,
    startTime: startTime,
    endTime: endTime
  };

  SaveMealPlans(allPlans);
  req.session.flashMessage = "Meal updated successfully!";
  res.redirect('/meal-planner');
});

// Delete a meal from the user's plan
router.post('/meal-planner/delete', requireAuth, (req, res) => {
  const { mealName, mealDate, mealStartTime, mealEndTime } = req.body;

  if (!mealName || !mealDate || !mealStartTime || !mealEndTime) {
    req.session.flashError = "Validation Failed: Missing required fields.";
    return res.redirect('/meal-planner');
  }

  const allPlans = getMealPlans();
  const userPlan = allPlans.find(p => p.username === req.session.username);

  if (!userPlan || !userPlan.meals) {
    req.session.flashError = "Meal plan not found.";
    return res.redirect('/meal-planner');
  }

  const mealIndex = userPlan.meals.findIndex(meal =>
    meal.name === mealName &&
    meal.date === mealDate &&
    meal.startTime === mealStartTime &&
    meal.endTime === mealEndTime
  );

  if (mealIndex === -1) {
    req.session.flashError = "Meal not found.";
    return res.redirect('/meal-planner');
  }

  userPlan.meals.splice(mealIndex, 1);
  SaveMealPlans(allPlans);
  req.session.flashMessage = "Meal deleted successfully!";
  res.redirect('/meal-planner');
});

module.exports = router;

/* END OF MEAL PLANNER LOGIC */
/* Helper Functions */

function getMealPlans() {
  if (!fs.existsSync(MEALPLAN_FILE)) return [];
  return JSON.parse(fs.readFileSync(MEALPLAN_FILE , 'utf-8')) || [];
}

function SaveMealPlans(data) {
  fs.writeFileSync(MEALPLAN_FILE, JSON.stringify(data, null , 2));
}

function getRecipes() {
  if (!fs.existsSync(RECIPES_FILE)) return [];
  return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8')) || [];
}

function insertMealSorted(meals, newMeal) {
  const index = meals.findIndex(meal => {
    const existingDate = new Date(meal.date + "T00:00:00");
    const newDate = new Date(newMeal.date + "T00:00:00");
    if (newDate < existingDate) return true;
    if (newDate > existingDate) return false;

    return timeToMinutes(newMeal.startTime) < timeToMinutes(meal.startTime);
  });

  if (index === -1) meals.push(newMeal);
  else meals.splice(index, 0, newMeal);
}

function hasTimeConflict(meals, newMeal) {
  return meals.some(meal => {
    if (meal.date !== newMeal.date) return false;

    const newStart = timeToMinutes(newMeal.startTime);
    const newEnd = timeToMinutes(newMeal.endTime);
    const existingStart = timeToMinutes(meal.startTime);
    const existingEnd = timeToMinutes(meal.endTime);

    return !(newEnd <= existingStart || newStart >= existingEnd);
  });
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

module.exports = router;
