const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');

const RECIPES_FILE = path.join(__dirname, "../data/recipes.json");

const FAVORITES_FILE = path.join(__dirname, '../data/favoriteRecipe.json');

// Show all recipes
router.get('/recipes', requireAuth, (req, res) => {
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
        flashError,
        time,
        cost,
        difficulty,
        dietary,
        searchQuery, // Pass this to the frontend to trigger the Return button
    });
});

// Handle update
router.put('/recipes/:id', requireAuth, (req, res) => {
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
        difficulty: difficulty.trim(),
        videoURL: null // TODO: Add video URL later 
    };
    saveRecipes(allRecipes);
    req.session.flashMessage = "Recipe updated successfully!";
    const redirectUrl = req.get("referer") || "/recipes";
    res.redirect(redirectUrl);
});

// Handle delete
router.delete('/recipes/:id', requireAuth, (req, res) => { // delete recipe from database
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

    fs.readFile(FAVORITES_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            console.error("Error reading favorites file:", err);
            return res.redirect('/recipes');
        }
    fs.writeFile(FAVORITES_FILE, JSON.stringify((data ? JSON.parse(data) : []).filter(fav => fav.id !== id), null, 2), 'utf8', (writeErr) => {
        if (writeErr) {
            console.error("Error updating favorites file:", writeErr);
        }
        });
    });

    res.redirect('/recipes');
});

/*CREATING RECIPE*/
router.post('/recipes', (req, res) => {

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
        difficulty: difficulty.trim(),  
        videoURL: null // TODO: Add video URL later 
    };
    // Save to JSON file
    fs.readFile(RECIPES_FILE, 'utf8', (err, data) => {
        if (err) {
            req.session.flashError = "Database Error: Could not read recipes.";
            return res.redirect('/recipes');
        }

        let recipes = [];
        try {
            if (data) recipes = JSON.parse(data);           
            recipes.unshift(newRecipe);
            fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8', (writeErr) => {
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

router.get('/recipes/:id/video', (req, res) => {
    const id = req.params.id;
    const recipe = getRecipes().find(r => r.id === id);
    if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
    }
    res.json({ videoURLs: [recipe.videoURL_1, recipe.videoURL_2, recipe.videoURL_3] });
});

router.post('/recipes/:id/video/favorites', requireAuth, (req, res) => {

    const id = req.params.id;
    const { videoURL } = req.body;
    const username = req.session.username;

    if (!videoURL || typeof videoURL !== 'string' || !videoURL.trim()) {
        return res.status(400).json({ error: "Missing or invalid videoURL." });
    }
 
    fs.readFile(FAVORITES_FILE, 'utf8', (err, data) => {
        if (err && err.code !== 'ENOENT') {
            return res.status(500).json({ error: "Could not read favorites." });
        }

        let favorites = [];
        if (data) {
            try {
                favorites = JSON.parse(data);
            } catch (parseErr) {
                return res.status(500).json({ error: "Server processing error." });
            }
        }

        const existing = favorites.some(fav => fav.username === username && fav.id === id && fav.videoURL === videoURL);
        if (existing) {
            return res.status(409).json({ error: "Video already in favorites." });
        }

        favorites.push({ username, id, videoURL });

        fs.writeFile(FAVORITES_FILE, JSON.stringify(favorites, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: "Could not save favorite." });
            }
            res.json({ success: true });
        });
    });
});

router.get('/favorites/check/:id', requireAuth, (req, res) => {
    const id = req.params.id;
    const videoURL = req.query.videoURL;
    const username = req.session.username;

    if (!videoURL || typeof videoURL !== 'string' || !videoURL.trim()) {
        return res.status(400).json({ error: "Missing or invalid videoURL." });
    }

    fs.readFile(FAVORITES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Could not read favorites." });
        }
        try {
            let favorites = [];
            if (data) favorites = JSON.parse(data);
            const isFavorite = favorites.some(fav => fav.username === username && fav.id === id && fav.videoURL === videoURL);
            res.json({ isFavorite });
        } catch (parseErr) {
            return res.status(500).json({ error: "Server processing error." });
        }
    });
});



router.get('/favorites', requireAuth, (req, res) => {
    const username = req.session.username;
    fs.readFile(FAVORITES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Could not read favorites." });
        }
        try {
            let favorites = [];
            if (data) favorites = JSON.parse(data);
            const userFavorites = favorites.filter(fav => fav.username === username);
            res.json({ favorites: userFavorites });
        } catch (parseErr) {
            return res.status(500).json({ error: "Server processing error." });
        }
    });
});

router.delete('/favorites/:id', requireAuth, (req, res) => {
    const username = req.session.username;
    const id = req.params.id;
    const { videoURL } = req.body;
    if (!videoURL || typeof videoURL !== 'string' || !videoURL.trim()) {
        return res.status(400).json({ error: "Missing or invalid videoURL." });
    }
    fs.readFile(FAVORITES_FILE, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: "Could not read favorites." });
        }
        try {
            let favorites = [];
            if (data) favorites = JSON.parse(data);
            const updatedFavorites = favorites.filter(fav => !(fav.username === username && fav.id === id && fav.videoURL === videoURL));
            fs.writeFile(FAVORITES_FILE, JSON.stringify(updatedFavorites, null, 2), 'utf8', (writeErr) => {
                if (writeErr) {
                    return res.status(500).json({ error: "Could not update favorites." });
                }
                res.json({ success: true });
            });
        } catch (parseErr) {
            return res.status(500).json({ error: "Server processing error." });
        }
    });
});

/* Helper functions */

// Helper function to get all recipes
function getRecipes() {
    if (!fs.existsSync(RECIPES_FILE)) return [];
    return JSON.parse(fs.readFileSync(RECIPES_FILE, 'utf8')) || [];
}

// Helper function to save recipes back to json file
function saveRecipes(data) {
    fs.writeFileSync(RECIPES_FILE, JSON.stringify(data, null, 2));
}

// Helper function to generate unique IDs
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

// Helper function for filtering
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

module.exports = router;