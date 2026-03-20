const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

const MEALPLAN_FILE = path.join(__dirname , '../data/MealPlans.json');
const RECIPES_FILE = path.join(__dirname,'../data/recipes.json');

// Showing the meal planner page
router.get('/meal-planner', requireAuth , (req, res) => {
  
  //1. get all meal plans from the file
  //2. filter the plans to get the one for the user
  //3. for each day, find the corresponding recipes using id
  //4. ? the format is either show recipe name (easier)or take recipe from recipe file
  // (Harder, but if we click on it we can see the recipe details, eventual goal) 
  //for now ill just show recipe name ill talk to the team after
  //1. and 2.

 
  const flashError = req.session.flashError; // Grab the error from the session 
  delete req.session.flashError; // Clear it immediately so it disappears if the user refreshes the page

  const AllPlans = getMealPlans();
  const SpecificUserPlan = AllPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  
  //3. base for 3 and optional 4.
  const recipeList = getRecipes();
  const userRecipes = recipeList.filter(r => r.username === req.session.username);

   
  // get the recipes created by the logged in user to show in the meal planner page
  const myPlan=[
    {
      "username":"test@gmail.com",
      "Monday":[],
      "Tuesday":[], 
      "Wednesday":[], 
      "Thursday":[], 
      "Friday":[], 
      "Saturday":[], 
      "Sunday":[]
    }
    
]
  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    recipes: userRecipes,
    username: req.session.username,
    plan: SpecificUserPlan ? SpecificUserPlan : myPlan, flashError // pass the user's meal plan or an empty array if none exists
  });
});


// Handling the form submission from the meal planner page when user adds a recipe to a specific day
router.post('/meal-planner', requireAuth , (req, res) => {
  const {recipeID,date,day,startTime,endTime} = req.body;


  // VALIDATE INPUTS 
  // Check for missing fields or unselected dropdowns
  if (!recipeID || recipeID === "none" || 
      !date || 
      !day || day === "none" || 
      !startTime || 
      !endTime) {
    req.session.flashError = "Validation Failed: Missing required fields.";
    return res.redirect('/meal-planner');
  }

  // Validate that start time is before end time
  if (startTime >= endTime) {
    console.error("Validation Failed: Start time must be before End time.");
    req.session.flashError = "Validation Failed: Start time must be before End time.";
    return res.redirect('/meal-planner');
  }


  // SAVE TO JSON FILE 
  const allPlans = getMealPlans();
  let userPlan = allPlans.find(p => p.username === req.session.username); // Find the meal plan for the logged in user

  // Create a skeleton plan if the user doesn't have one in the JSON yet
  if (!userPlan) {
    userPlan = { 
      username: req.session.username, 
      Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] 
    };
    allPlans.push(userPlan);
  }

  const selectedDate = new Date(date + "T00:00:00"); // convert date to a date object

  // Get start of the week (Sunday)
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
  weekStart.setHours(0, 0, 0, 0);

  // Get end of the week (Saturday)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; // define days of the week

  const alreadyExists = days.some(dayKey => // loop through days of the week
    (userPlan[dayKey] || []).some(meal => {
      if (meal.name !== recipeID) return false; // loop through the recipes at that day and check if same recipe name

      const mealDate = new Date(meal.date + "T00:00:00"); // if same recipe name then check if same week
      return mealDate >= weekStart && mealDate <= weekEnd; // if same week return true else return false
    })
  ); // This logic blocks users from having a recipe twice in the same week

  if (alreadyExists) {
    req.session.flashError = "This recipe is already scheduled in this week.";
    return res.redirect('/meal-planner');
  }

  // Check if there is already meal at that day and time
  if (hasTimeConflict(userPlan[day], { startTime, endTime })) {
    req.session.flashError = "Time conflict with another meal.";
    return res.redirect('/meal-planner');
  }

  // Push the new meal directly into the correct day's array using bracket notation []
  if (userPlan[day]) {
    insertMealSorted(userPlan[day], {
      name: recipeID,
      date: date,
      startTime: startTime,
      endTime: endTime
    });
  }

  // Save the updated plans array back to MealPlans.json
  SaveMealPlans(allPlans);

  // Send the user back to the meal planner page
  res.redirect('/meal-planner');
});

/* Helper Functions */

// Get all Meal Plans
function getMealPlans()
{
  if (!fs.existsSync(MEALPLAN_FILE))
  {
    return [];  // doesn't exist
  }
  return JSON.parse(fs.readFileSync(MEALPLAN_FILE , 'utf-8')) || [];
}

// Save Meal Plans
function SaveMealPlans(data)
{
  fs.writeFileSync(MEALPLAN_FILE,  JSON.stringify(data, null , 2));
}

// Get all Recipes
function getRecipes() {
    if (!fs.existsSync(RECIPES_FILE)) return [];
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8')) || [];
}

function validateAddition(plan){
  let decision =true;

  

  return decision;
}

function insertMealSorted(dayArray, newMeal) {
  const index = dayArray.findIndex(meal => {
    const existingDate = new Date(meal.date + "T00:00:00");
    const newDate = new Date(newMeal.date + "T00:00:00");

    // First compare date
    if (newDate < existingDate) return true;
    if (newDate > existingDate) return false;

    // If same date → compare time
    return newMeal.startTime < meal.startTime;
  });

  if (index === -1) {
    dayArray.push(newMeal);
  } else {
    dayArray.splice(index, 0, newMeal);
  }
}

function hasTimeConflict(dayArray, newMeal) {
  return dayArray.some(meal => {
    // Only check meals on same date
    if (meal.date !== newMeal.date) return false;

    // Check time overlap
    return !(newMeal.endTime <= meal.startTime || newMeal.startTime >= meal.endTime);
  });
}

module.exports = router;