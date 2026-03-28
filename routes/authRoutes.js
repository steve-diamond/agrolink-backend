const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
// You may want to add your authMiddleware here
const router = express.Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', getMe); // Add authMiddleware for protection
module.exports = router;
// Auth routes placeholder
const express = require('express');
const router = express.Router();
module.exports = router;
