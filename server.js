const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const session = require('express-session');
const methodOverride = require('method-override');

const authRoutes = require('./routes/authRoutes'); // routes for login, register, logout
const profileRoutes = require('./routes/profileRoutes'); // routes for profile
const recipeRoutes = require('./routes/recipeRoutes'); // routes for recipes (CRUD)
const mealPlannerRoutes = require('./routes/MealPlannerRoutes'); // routes for meal planner

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

// Send request to routes
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", recipeRoutes);
app.use("/", mealPlannerRoutes);

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}