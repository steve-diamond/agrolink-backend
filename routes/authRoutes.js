const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const captcha = require("../middleware/captcha");
const rateLimit = require("../middleware/rateLimiter");


router.post("/register", authController.register);
router.post("/login", rateLimit, captcha, authController.login);

// Protected route to get current user
router.get("/me", authMiddleware, authController.getMe);

// Placeholder for password reset (to be implemented)
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);

module.exports = router;