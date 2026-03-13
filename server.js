const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = 3000;
const session = require('express-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
})); // using session to check if user is logged in or not

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/login");
  }
  res.render('home', { title: 'Home Page', currentPage: 'home', username: req.session.username });
});

app.post("/logout", (req, res) => {

  req.session.destroy(err => {
    if (err) {
      
      return res.redirect('/?logout_error=1');
    }
    // Redirect to login page after successful logout
    res.redirect('/login');
  });
});


app.get("/login", (req, res) => {
  const errorMessage = req.session.loginError || null;

  // clear it so refresh doesn't show it again
  req.session.loginError = null;

  res.render('login', { title: 'Login', currentPage: 'login', username: req.session.username, errorMessage });
});

app.post("/login", async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  const usersPath = path.join(__dirname, 'data', 'users.json');

  try {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.find(u => u.username === username);

    if (!user) {
      req.session.loginError = 'Invalid credentials.';
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      req.session.username = username;
      if (rememberMe){
        req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
      }
      return res.redirect('/');
    } else {
      req.session.loginError = 'Invalid credentials.';
      return res.redirect('/login');
    }

  } catch (err) {
    console.error('Login error:', err);
    req.session.loginError = 'Server error. Please try again.';
    res.redirect('/login');
  }
});

app.get("/register", (req, res) => {
  const errorMessage = req.session.registerError || null;

  // clear after reading
  req.session.registerError = null;

  res.render('register', { title: 'Register', currentPage: 'register', username: req.session.username, errorMessage });
});

app.post("/register", (req, res) => {
  const {username, password, confirmPassword} = req.body;

  const error = validateCredentials(username, password, confirmPassword);
  if (error) { // if null then if doesn't run
    req.session.registerError = error;
    return res.redirect('/register'); // print the error message and return them to the register page
  }

  const data = fs.readFile("data/users.json", "utf8", async (err, data) => {
    if (err) return res.status(500).send("Server Error");

    const users = JSON.parse(data || "[]");

    if(isDuplicate(users, username)){
      req.session.registerError = "Username already exists. Try again.";
      return res.redirect('/register');
    }

    try {
      await registerUser(users, username, password);
      res.redirect("/login");
    } catch (err) {
      res.status(500).send("Server Error");
    }
  })
});

function validateCredentials(username, password, confirmPassword) {
  const validChars = /^[a-zA-Z0-9]{5,}$/;
  const hasLetter = /[a-zA-Z]/;
  const hasDigit = /\d/;

  if (!username || !password || !confirmPassword) {
    return "All fields are required.";
  }

  if(password !== confirmPassword){
    return "Passwords do not match.";
  }

  if (!validChars.test(password) || !hasLetter.test(password) || !hasDigit.test(password)) {
    return "Password rules were not followed.";
  }

  return null; // means valid
}

function isDuplicate(users, username){
  // Search if username already exist. Don't allow same username different capitalization
  const exists = users.some(user => user.username.toLowerCase() === username.toLowerCase());

  return exists; // returns true is duplicate, false if not
}

async function registerUser(users, username, password){
  const saltRounds = 10;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  users.push({username, password: hashedPassword});
  await fs.promises.writeFile("data/users.json", JSON.stringify(users, null, 2));
}

// API FOR PROFILE MANAGEMENT 
const PREFERENCES_FILE = path.join(__dirname, 'data', 'preferences.json');

function getPreferences() {
    if (!fs.existsSync(PREFERENCES_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf8')) || []; } // read data
    catch (err) { return []; }
}

function savePreferences(data) {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(data, null, 2)); // save data
}

// Renders the page with the user's saved data
app.get("/profile", (req, res) => {
    if (!req.session.username) return res.redirect('/login');

    const allPrefs = getPreferences();
    const userPref = allPrefs.find(p => p.username === req.session.username);

    res.render('profile-management', {
        title: 'Profile Management',
        currentPage: 'profile',
        username: req.session.username,
        userData: userPref || { preference: 'none', allergies: [] }
    });
});

// JS file sends data here to save it
app.post("/api/save-profile", (req, res) => {

// Check if logged in
    if (!req.session.username) return res.status(401).send("Not logged in");

    const { preference, allergies } = req.body; 
    
    
    console.log(`Saving for ${req.session.username}:`, { preference, allergies }); // terminal to see if this prints

    let allPrefs = getPreferences();
    
    // Find and update the user
    const existingIndex = allPrefs.findIndex(p => p.username === req.session.username);
    if (existingIndex !== -1) {
        allPrefs[existingIndex].preference = preference;
        allPrefs[existingIndex].allergies = allergies;
    } else {
        allPrefs.push({ username: req.session.username, preference, allergies });
    }

    savePreferences(allPrefs);
    res.json({ status: "success" });
});

const RECIPES_FILE = path.join(__dirname, 'data', 'recipes.json');

// helper functions
function getRecipes() {
    if (!fs.existsSync(RECIPES_FILE)) return [];
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8')) || [];
}

function saveRecipes(data) {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
    if (!req.session.username) {
        return res.redirect('/login');
    }
    next();
}

// Show all recipes

app.get('/recipes', requireAuth, (req, res) => {
    // Grab messages from the session
    const flashMessage = req.session.flashMessage;
    const flashError = req.session.flashError;
    
    // Clear them immediately so they don't get stuck on the screen after refreshing
    delete req.session.flashMessage;
    delete req.session.flashError;

    const allRecipes = getRecipes();
    
    let recipes = allRecipes.filter(r => r.username === req.session.username); // only show user's recipes and apply filter if on

    // Get search term from query parameters
    const searchQuery = req.query.search ? req.query.search.trim() : "";
    
    const time = req.query.time || "none";
    const cost = req.query.cost || "none";
    const difficulty = req.query.difficulty || "none";
    const dietary = req.query.dietary || "none";
    
    recipes = recipes.filter(recipe => {
      const passesFilter = filterRecipeServer(recipe, { time, cost, difficulty, dietary });

      if (!passesFilter) return false;

      if (!searchQuery) return true;

      const lowerSearch = searchQuery.toLowerCase();

      const matchesName = recipe.name.toLowerCase().includes(lowerSearch);
      const matchesIngredient = recipe.ingredients.some(ing =>
          ing.toLowerCase().includes(lowerSearch)
      );

      return matchesName || matchesIngredient;
    });
 

    res.render('recipes', { 
        title: 'Recipes', 
        currentPage: 'recipes', 
        username: req.session.username, 
        recipes, 
        flashMessage,
        time,
        cost,
        difficulty,
        dietary,
        searchQuery, // Pass this to the frontend to trigger the Return button
    });
});

// Show create form
app.get('/recipes/create', requireAuth, (req, res) => {
    res.render('create-recipe', { title: 'Create Recipes', currentPage: 'create-recipe', username: req.session.username });
});

// Handle create
app.post('/recipes/create', requireAuth, (req, res) => {
    // save recipe logic
});

// Show edit form
app.get('/recipes/:id/edit', requireAuth, (req, res) => {
    // load recipe
    res.render('edit-recipe', { title: 'Edit Recipes', currentPage: 'edit-recipe', username: req.session.username }); // add id later when implemented
});

// Handle update
app.put('/recipes/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const username = req.session.username;
    const { name, ingredients, Steps, time, cost, tags, difficulty } = req.body;

    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!ingredients) missingFields.push("ingredients");
    if (!Steps) missingFields.push("Steps");
    if (!time) missingFields.push("time");
    if (!cost) missingFields.push("cost");
    if (!tags) missingFields.push("tags");
    if (!difficulty) missingFields.push("difficulty");

    if (missingFields.length > 0) {
        req.session.flashError = `Update failed. Missing: ${missingFields.join(", ")}.`;
        return res.redirect('/recipes');
    }

    let formattedCost = (cost || "").trim().replace(/\s/g, '');
    if (formattedCost.endsWith('$')) {
        formattedCost = '$' + formattedCost.slice(0, -1);
    } else if (!formattedCost.startsWith('$')) {
        formattedCost = '$' + formattedCost;
    }

    let parsedIngredients = [];
    try {
        parsedIngredients = JSON.parse(ingredients);
    } catch {
        parsedIngredients = (ingredients || "").split(',').map(i => i.trim());
    }

    const allRecipes = getRecipes();
    const idx = allRecipes.findIndex(r => r.id === id && r.username === username);
    if (idx === -1) {
        req.session.flashError = "Recipe not found.";
        return res.redirect('/recipes');
    }

    allRecipes[idx] = {
        ...allRecipes[idx],
        name: name.trim(),
        ingredients: parsedIngredients,
        prepTime: time.trim(),
        prepSteps: Steps.trim(),
        cost: formattedCost,
        tag: tags.trim(),
        difficulty: difficulty.trim()
    };
    saveRecipes(allRecipes);
    req.session.flashMessage = "Recipe updated successfully!";
    const redirectUrl = req.get("referer") || "/recipes";
    res.redirect(redirectUrl);
});

// Handle delete
app.delete('/recipes/:id', requireAuth, (req, res) => { // delete recipe from database
    const id = req.params.id;
    const username = req.session.username;

    let allRecipes = getRecipes();
    const originalLength = allRecipes.length;

    const filteredRecipes = allRecipes.filter(recipe => {
      return !(recipe.id === id && recipe.username === username);
    });

    if (filteredRecipes.length < originalLength) {
      req.session.flashMessage = "Recipe deleted successfully!";
    }

    saveRecipes(filteredRecipes);

    res.redirect('/recipes');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});



/*CREATING RECIPE*/
app.post('/recipes', (req, res) => {

    // This will print the exact data the frontend sent into VS Terminal
    //console.log("NEW RECIPE SUBMISSION");
    //console.log(req.body);

    // Grab what the frontend is sending in req.body
    const { name, ingredients, Steps, time, cost, tags, difficulty } = req.body;

    // Validate using variable names
    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!ingredients) missingFields.push("ingredients");
    if (!Steps) missingFields.push("Steps");
    if (!time) missingFields.push("time");
    if (!cost) missingFields.push("cost");
    if (!tags) missingFields.push("tags");
    if (!difficulty) missingFields.push("difficulty");

    if (missingFields.length > 0) {
        // 4.4 Save to session and redirect
        req.session.flashError = `Submission Failed! Missing fields: ${missingFields.join(", ")}. Please check your form.`;
        return res.redirect('/recipes');
    }

    // Format the Cost
    let formattedCost = cost.trim().replace(/\s/g, ''); 
    if (formattedCost.endsWith('$')) {
        formattedCost = '$' + formattedCost.slice(0, -1);
    } else if (!formattedCost.startsWith('$')) {
        formattedCost = '$' + formattedCost;
    }

    // Parse the ingredients string into an actual JavaScript array
    let parsedIngredients = [];
    try {
        parsedIngredients = JSON.parse(ingredients);
    } catch (error) {
        // Fallback in case the frontend ever sends it as a comma-separated string
        parsedIngredients = ingredients.split(',').map(item => item.trim());
    }

    // Create the new recipe object matching recipes.json structure 
    const newRecipe = {
        id: generateUniqueId(), 
        username: req.session && req.session.username ? req.session.username : "test@gmail.com",
        name: name.trim(),
        ingredients: parsedIngredients,
        prepTime: time.trim(),       
        prepSteps: Steps.trim(),     
        cost: formattedCost,
        tag: tags.trim(),
        difficulty: difficulty.trim()        
    };
    // Save to JSON file
    const filePath = path.join(__dirname, 'data', 'recipes.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            req.session.flashError = "Database Error: Could not read recipes.";
            return res.redirect('/recipes');
        }

        let recipes = [];
        try {
            if (data) recipes = JSON.parse(data);           
            recipes.unshift(newRecipe);
            fs.writeFile(filePath, JSON.stringify(recipes, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    req.session.flashError = "Database Error: Could not save recipe.";
                    return res.redirect('/recipes');
                }                
                // 4.4 Save success message to session and redirect
                req.session.flashMessage = "Recipe successfully created!";
                res.redirect('/recipes');
            });
        } catch (parseErr) {
            req.session.flashError = "Server processing error.";
            res.redirect('/recipes');
        }
    });
});


function generateUniqueId() {
    const allRecipes = getRecipes();
    let newId;
    let exists = true;

    while (exists) {
        newId = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit ID
        exists = allRecipes.some(recipe => recipe.id === newId);
    }

    return newId;
  }

function filterRecipeServer(recipe, filter) {

    let decision = true;

    // TIME
    if (filter.time && filter.time !== "none") {
        let recipeTime = parseInt(recipe.prepTime);
        decision = decision && (recipeTime <= parseInt(filter.time));
    }

    // COST
    if (filter.cost && filter.cost !== "none") {
        let recipeCost = parseFloat(recipe.cost.replace('$', '')) || 0;

        if (filter.cost === "low") {
            decision = decision && recipeCost <= 25;
        } 
        else if (filter.cost === "medium") {
            decision = decision && recipeCost > 25 && recipeCost <= 75;
        } 
        else if (filter.cost === "high") {
            decision = decision && recipeCost > 75;
        }
    }

    // DIETARY (using tag)
    if (filter.dietary && filter.dietary !== "none") {
        decision = decision && recipe.tag.toLowerCase().includes(filter.dietary.toLowerCase());
    }

    if (filter.difficulty && filter.difficulty !== "none") {
      decision = decision && (recipe.difficulty || "").toLowerCase() === filter.difficulty.toLowerCase();
    }

    return decision;
}



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
app.get('/meal-planner', requireAuth , (req, res) => {
  const AllPlans = getMealPlans();
  const SpecificUserPlan = AllPlans.find(
    p => p.username === req.session.username  // find the meal plan for the logged in user, if it exists
  );
  // If frontend requests JSON
  if (req.query.format === 'json') {
    return res.json({
      username: req.session.username,
      plan: SpecificUserPlan ? SpecificUserPlan.plan : [] // if user has a plan return it, otherwise return empty array
    });
  }
  // Otherwise render the page normally
  res.render('meal-planner', {
    title: 'Meal Planner',
    currentPage: 'meal-planner',
    username: req.session.username,
    plan: SpecificUserPlan || null
  });
});

app.post('/meal-planner', requireAuth , (req, res) => {
  const { plan } = req.body; // Get the meal plan data from the request body

  let allPlans = getMealPlans();

  const existingIndex = allPlans.findIndex(p => p.username === req.session.username); // Check if the user already has a meal plan
  
  if (existingIndex !== -1) {
    allPlans[existingIndex].plan = plan; // Update the existing meal plan
  } else {
    allPlans.push({ username: req.session.username, plan }); // Add a new meal plan for the user
  }

  SaveMealPlans(allPlans); // Save the updated meal plans back to the JSON file

  res.json({ status: "success" }); // Send a success response back to the client
});
/* END OF MEAL PLANNER LOGIC */

