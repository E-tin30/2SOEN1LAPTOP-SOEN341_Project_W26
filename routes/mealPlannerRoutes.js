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
const myPlan=[
    {
       "username":"test@gmail.com",
       "Monday":[{"name":"Creamy Garlic Chicken Pasta","date": "2026-03-11","startTime": "18:00","endTime": "19:00"}],
      "Tuesday":[{}], "Wednesday":[{}], "Thursday":[{}], "Friday":[{}], "Saturday":[{}], "Sunday":[{}]
      
      
    }
    
]
  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    recipes: userRecipes,
    username: req.session.username,
    plan: SpecificUserPlan ? SpecificUserPlan : myPlan // pass the user's meal plan or an empty array if none exists
  });
});
// Handling the form submission from the meal planner page when user adds a recipe to a specific day
router.post('/meal-planner', requireAuth , (req, res) => {
  const {recipeID,date,day,startTime,endTime} = req.body;

  //We'll have to validate the inputs here.
  console.log({
    recipeID,
    date,
    day,
    startTime,
    endTime
  });

  const allPlans = getMealPlans();

  let userPlan = allPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  //create plan if it doesnt exist
  if (!userPlan) {
    userPlan = { username: req.session.username, Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };  // if not, create a new one for the user
    allPlans.push(userPlan);
  }
// add the selected recipe to the plan
// find The day then push it to the right day array
 if(day==="Monday"){userPlan.Monday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Tuesday"){userPlan.Tuesday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Wednesday"){userPlan.Wednesday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Thursday"){userPlan.Thursday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Friday"){userPlan.Friday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Saturday"){userPlan.Saturday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}
  else if(day==="Sunday"){userPlan.Sunday.push({name: recipeID, date: date, startTime: startTime, endTime: endTime})}

 SaveMealPlans(allPlans);

  res.redirect('/meal-planner');
});
module.exports = router;
/* END OF MEAL PLANNER LOGIC */
