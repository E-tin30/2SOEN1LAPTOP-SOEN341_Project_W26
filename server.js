const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = 3000;
const session = require('express-session');

app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'mySecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.render('Home', { title: 'Home Page', currentPage: 'home', username: req.session.username });
});

app.get("/login", (req, res) => {
  res.render('Login', { title: 'Login', currentPage: 'home', username: req.session.username });
});

app.get("/register", (req, res) => {
  res.render('Register', { title: 'Register', currentPage: 'register', username: req.session.username });
});

app.get("/profile", (req, res) => {
  res.render('ProfileManagement', { title: 'Profile', currentPage: 'profile', username: req.session.username });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});