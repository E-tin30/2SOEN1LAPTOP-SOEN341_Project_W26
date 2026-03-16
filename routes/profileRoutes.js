const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const requireAuth = require('../middleware/requireAuth');

const PREFERENCES_FILE = path.join(__dirname, '../data/preferences.json');