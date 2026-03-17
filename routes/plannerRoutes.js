const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

router.get("/meal-planner", requireAuth, (req, res) => {
    res.render('meal-planner', { title: 'Meal Planner', currentPage: 'planner', username: req.session.username });
});

module.exports = router;