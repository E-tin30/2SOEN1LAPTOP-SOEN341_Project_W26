const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

// API FOR PROFILE MANAGEMENT 
const PREFERENCES_FILE = path.join(__dirname, '../data/preferences.json');

// Renders the page with the user's saved data
router.get("/profile", requireAuth, (req, res) => {
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
router.post("/api/save-profile", requireAuth, (req, res) => {
    const { preference, allergies } = req.body; 

    console.log(`Saving for ${req.session.username}:`, { preference, allergies }); // terminal to see if this prints

    let allPrefs = getPreferences();

    // Find and update the user
    allPrefs = updateUserPreferences(allPrefs, req.session.username, preference, allergies);

    savePreferences(allPrefs);
    res.json({ status: "success" });
});

/* Helper Functions */

// Helper function to get all preferences from preferences.json
function getPreferences() {
    if (!fs.existsSync(PREFERENCES_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(PREFERENCES_FILE, 'utf8')) || []; } // read data
    catch (err) { return []; }
}

// Helper function to save preferences back to preferences.json
function savePreferences(data) {
    fs.writeFileSync(PREFERENCES_FILE, JSON.stringify(data, null, 2)); // save data
}

// Helper function to find a user's preferences from the array
function findUserPreference(allPrefs, username) {
    return allPrefs.find(p => p.username === username) || null;
}

// Helper function to update or add user preferences in the array
function updateUserPreferences(allPrefs, username, preference, allergies) {
    const existingIndex = allPrefs.findIndex(p => p.username === username);
    if (existingIndex !== -1) {
        allPrefs[existingIndex].preference = preference;
        allPrefs[existingIndex].allergies = allergies;
    } else {
        allPrefs.push({ username, preference, allergies });
    }
    return allPrefs;
}

module.exports = router;
module.exports.getPreferences = getPreferences; // Exporting for use in other routes (e.g., mealRoutes.js)
module.exports.savePreferences = savePreferences; // Exporting for use in other routes (e.g., mealRoutes.js)
module.exports.updateUserPreferences = updateUserPreferences;
module.exports.findUserPreference = findUserPreference;