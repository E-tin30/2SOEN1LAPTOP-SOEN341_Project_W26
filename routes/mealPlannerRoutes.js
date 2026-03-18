const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');


/* MEALPLANNER JSON STRUCTURE */
const MEALPLAN_FILE = path.join(__dirname , 'data' , 'MealPlans.json');

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

// Showing the meal planner page
router.get('/meal-planner', requireAuth , (req, res) => {
  
  const AllPlans = getMealPlans();
  const SpecificUserPlan = AllPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  
  
  /*TESTING PURPOSES - HARDCODED MEAL PLAN TO SHOW HOW IT WORKS. THIS IS THE STRUCTURE THE MEAL PLANS MUST BE IN FOR THE FRONTEND TO RENDER IT CORRECTLY. THE REAL DATA WILL BE PULLED FROM MealPlans.json
  const testPlan = [
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
    plan: //testPlan 
    SpecificUserPlan ? SpecificUserPlan.plan : [] // pass the user's meal plan or an empty array if none exists
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

  let dayEntry = userPlan.plan.find(d => d.day === day);  // find the specific day entry in the user's plan

  if (!dayEntry) {
    dayEntry = { day: day, meals: [] }; // if it doesn't exist, create it
    userPlan.plan.push(dayEntry); // add the new day entry to the user's plan
  }
  SaveMealPlans(allPlans);

  res.redirect('/meal-planner');
});
module.exports = router;
/* END OF MEAL PLANNER LOGIC */
