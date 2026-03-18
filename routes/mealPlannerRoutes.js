const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');


/* MEALPLANNER JSON STRUCTURE */
const MEALPLAN_FILE = path.join(__dirname , '../data/MealPlans.json');
const RECIPES_FILE = path.join(__dirname,'../data/recipes.json');

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
    if (!fs.existsSync(RECIPES_FILE)) return [];
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8')) || [];
}

function validateAddition(plan){
  let decision =true;

  

  return decision;
}
// Showing the meal planner page
router.get('/meal-planner', requireAuth , (req, res) => {
  
  //1. get all meal plans from the file
  //2. filter the plans to get the one for the user
  //3. for each day, find the corresponding recipes using id
  //4. ? the format is either show recipe name (easier)or take recipe from recipe file
  // (Harder, but if we click on it we can see the recipe details, eventual goal) 
  //for now ill just show recipe name ill talk to the team after
 //1. and 2.
  const AllPlans = getMealPlans();
  const SpecificUserPlan = AllPlans.filter(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  
  //3. base for 3 and optional 4.
  const recipeList = getRecipes();
  const userRecipes = recipeList.filter(r => r.username === req.session.username);

   
   // get the recipes created by the logged in user to show in the meal planner page
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
const myPlan=[
    {
       "username":"test@gmail.com",
       "Monday":[{"name":"Creamy Garlic Chicken Pasta","date": "2026-03-11","startTime": "18:00","endTime": "19:00"},
      {"name": "Spaghetti","date": "2026-03-12","startTime": "12:00","endTime": "13:00"}],
      "Tuesday":[{}], "Wednesday":[{}], "Thursday":[{}], "Friday":[{}], "Saturday":[{}], "Sunday":[{}]
      
      
    }
    
]
  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    recipes: userRecipes,
    username: req.session.username,
    plan: myPlan // pass the user's meal plan or an empty array if none exists
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

  let dayEntry = userPlan.plan.find(d => d.day === day);  ///THIS IS THE LINE// find the specific day entry in the user's plan

  if (!dayEntry) {
    dayEntry = { day: day, meals: [] }; // if it doesn't exist, create it
    userPlan.plan.push(dayEntry); // add the new day entry to the user's plan
  }
  SaveMealPlans(allPlans);

  res.redirect('/meal-planner');
});
module.exports = router;
/* END OF MEAL PLANNER LOGIC */
