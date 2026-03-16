const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = 3000;
const session = require('express-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');

const authRoutes = require('./routes/authRoutes'); // routes for login, register, logout
const profileRoutes = require('./routes/profileRoutes'); // routes for profile
const recipeRoutes = require('./routes/recipeRoutes'); // routes for recipes (CRUD)

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

module.exports = app;