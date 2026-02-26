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
    const flashMessage = req.session.flashMessage;
    delete req.session.flashMessage;

    const allRecipes = getRecipes(); // returns all recipes
    const recipes = allRecipes.filter(r => r.username === req.session.username); // filter to get only recipes for that user
    res.render('recipes', { title: 'Recipes', currentPage: 'recipes', username: req.session.username, recipes, flashMessage });
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
    // update logic
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









app.post('/recipes', (req, res) => {
    // This will print the exact data the frontend sent into your VSCode Terminal
    //console.log("=== NEW RECIPE SUBMISSION ===");
    //console.log(req.body); 

    // Grab EXACTLY what the frontend is sending in req.body (Notice: 'Steps' and 'tags')
    const { name, ingredients, Steps, time, cost, tags } = req.body;

    // Validate using those exact variable names
    let missingFields = [];
    if (!name) missingFields.push("name");
    if (!ingredients) missingFields.push("ingredients");
    if (!Steps) missingFields.push("Steps");
    if (!time) missingFields.push("time");
    if (!cost) missingFields.push("cost");
    if (!tags) missingFields.push("tags");

    if (missingFields.length > 0) {
        return res.status(400).send(`
            <h2>Submission Failed!</h2>
            <p>The backend is looking for specific variable names, but the frontend didn't send them.</p>
            <p><strong>Missing fields:</strong> ${missingFields.join(", ")}</p>
            <p><em>Tell your teammate to check the 'name="..."' attributes in their HTML form!</em></p>
            <br><a href="/recipes">Go Back</a>
        `);
    }

    // Format the Cost (e.g., converts "8$" to "$8")
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

    // Create the new recipe object matching your recipes.json structure EXACTLY
    const newRecipe = {
        id: Math.floor(1000 + Math.random() * 9000).toString(), // Generates random 4-digit ID
        username: req.session && req.session.username ? req.session.username : "test@gmail.com",
        name: name.trim(),
        ingredients: parsedIngredients,
        prepTime: time.trim(),       // Maps UI 'time' to DB 'prepTime'
        prepSteps: Steps.trim(),     // Maps UI 'Steps' to DB 'prepSteps'
        cost: formattedCost,
        tag: tags.trim()             // Maps UI 'tags' to DB 'tag'
    };

    // Save to JSON file
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'data', 'recipes.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).send("Error reading database: " + err.message);

        let recipes = [];
        try {
            if (data) recipes = JSON.parse(data);
            
            // Append the newly created recipe
            recipes.push(newRecipe);

            // Write it back to the JSON file formatted nicely
            fs.writeFile(filePath, JSON.stringify(recipes, null, 2), 'utf8', (writeErr) => {
                if (writeErr) return res.status(500).send("Error saving recipe: " + writeErr.message);
                
                // Success! Redirect back to the recipes page
                res.redirect('/recipes');
            });
        } catch (parseErr) {
            res.status(500).send("Error processing data.");
        }
    });
});