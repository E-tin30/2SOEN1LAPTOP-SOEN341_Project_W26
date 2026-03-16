const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');

