const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');

router.get("/", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/login");
  }
  res.render('home', { title: 'Home Page', currentPage: 'home', username: req.session.username });
});

router.post("/logout", (req, res) => {

  req.session.destroy(err => {
    if (err) {
      
      return res.redirect('/?logout_error=1');
    }
    // Redirect to login page after successful logout
    res.redirect('/login');
  });
});


router.get("/login", (req, res) => {
  const errorMessage = req.session.loginError || null;

  // clear it so refresh doesn't show it again
  req.session.loginError = null;

  res.render('login', { title: 'Login', currentPage: 'login', username: req.session.username, errorMessage });
});

router.post("/login", async (req, res) => {
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

router.get("/register", (req, res) => {
  const errorMessage = req.session.registerError || null;

  // clear after reading
  req.session.registerError = null;

  res.render('register', { title: 'Register', currentPage: 'register', username: req.session.username, errorMessage });
});

router.post("/register", (req, res) => {
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

// Helper functions

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