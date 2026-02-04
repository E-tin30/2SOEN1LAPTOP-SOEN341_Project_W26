const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = 3000;
const session = require('express-session');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
})); // using session to check if user is logged in or not

// Set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/login");
  }
  res.render('Home', { title: 'Home Page', currentPage: 'home', username: req.session.username });
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
  const error = req.query.error;
  const errorMessage = error === 'invalid' ? 'Invalid creditentials.' : error === 'server' ? 'Server error. Please try again.' : null;
  res.render('Login', { title: 'Login', currentPage: 'login', username: req.session.username, errorMessage });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  const usersPath = path.join(__dirname, 'data', 'users.json');

  try {
    const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    const user = usersData.find(u => u.username === username && u.password === password);

    if (user) {
      req.session.username = username;
      res.redirect('/');
    } else {
      res.redirect('/login?error=invalid');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.redirect('/login?error=server');
  }
});

app.get("/", (req, res) => {
  if (!req.session.username) {
    return res.redirect("/login");
  }
  res.render('Home', { title: 'Home Page', currentPage: 'home', username: req.session.username });
});

app.get("/register", (req, res) => {
  res.render('Register', { title: 'Register', currentPage: 'register', username: req.session.username });
});

/*
Old code for profile management page

app.get("/profile", (req, res) => {
  res.render('ProfileManagement', { title: 'Profile', currentPage: 'profile', username: req.session.username });
});
*/

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.post("/register", (req, res) => {
  const {username, password, confirmPassword} = req.body;

  const error = validateCredentials(username, password, confirmPassword);
  if (error) { // if null then if doesn't run
    return res.status(400).send(`
      <script>
        alert("${error}");
        window.location.href = '/register';
      </script>
    `); // print the error message and return them to the register page
  }
  const data = fs.readFile("data/users.json", "utf8", (err, data) => {
    if (err) return res.status(500).send("Server Error");

    const users = JSON.parse(data || "[]");

    if(isDuplicate(users, username)){
      return res.status(400).send(`
        <script>
          alert("Username already exists. Try again.");
          window.location.href = '/register';
        </script>
      `);
    }

    registerUser(users, username, password, (err) => {
      if (err) return res.status(500).send("Server Error");
      res.redirect("/Login");
    });
  })
});

function validateCredentials(username, password, confirmPassword) {
  // const usernameRegex = /^[a-zA-Z0-9]+$/;
  const validChars = /^[a-zA-Z0-9]{5,}$/;
  const hasLetter = /[a-zA-Z]/;
  const hasDigit = /\d/;

  if (!username || !password || !confirmPassword) {
    return "All fields are required.";
  }

  if(password !== confirmPassword){
    return "Passwords do not match.";
  }

  // if (!usernameRegex.test(username)) {
  //   return "Username can only contain letters and digits.";
  // }

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

function registerUser(users, username, password, callback){
  users.push({username, password});
  fs.writeFile("data/users.json", JSON.stringify(users, null, 2), (err) => callback(err));
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

    res.render('ProfileManagement', {
        title: 'Profile Management',  // Fixes title error
        currentPage: 'profile',       // Fixes the page crash
        username: req.session.username,
        userData: userPref || { preference: 'none', allergies: [] } // <--- Fixes the "nothing happens" button bug
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
