const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

app.use("/", authRoutes);
app.use("/profile", profileRoutes);
app.use("/recipes", recipeRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;