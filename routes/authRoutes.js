const express = require("express");
const router = express.Router();
const User = require("./../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const user = new User({
      name,
      email,
      password,
      role,
    });

    await user.save();

    res.json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is not configured" });
    }

    const envAdminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const envAdminPassword = String(process.env.ADMIN_PASSWORD || "");
    const canonicalAdminEmail = envAdminEmail || "admin@agrolink.com";
    const adminEmailAliases = new Set([
      "admin@agrolink.com",
      "admin@agrolink.ng",
      "admin@dosagrolink.ng",
    ]);
    const normalizedLookupEmail = adminEmailAliases.has(normalizedEmail)
      ? canonicalAdminEmail
      : normalizedEmail;

    // Allow deterministic admin sign-in in development for local testing.
    const isDevMode = process.env.NODE_ENV !== "production";
    const defaultDevAdminEmails = adminEmailAliases;
    const defaultDevAdminPassword = String(process.env.DEFAULT_DEV_ADMIN_PASSWORD || "agro123456");
    const isDefaultDevAdmin =
      isDevMode && defaultDevAdminEmails.has(normalizedEmail) && password === defaultDevAdminPassword;
    const isEnvAdmin =
      Boolean(envAdminEmail && envAdminPassword) &&
      normalizedLookupEmail === envAdminEmail &&
      password === envAdminPassword;

    if (isDefaultDevAdmin || isEnvAdmin) {
      const token = jwt.sign(
        { id: "admin-dev", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );
      return res.json({ 
        token, 
        user: {
          _id: "admin-dev",
          name: "Admin",
          email: normalizedLookupEmail,
          role: "admin",
          approved: true
        }
      });
    }

    const user = await User.findOne({ email: normalizedLookupEmail }).select("+password");

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({ token, user: userResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+resetPasswordToken +resetPasswordExpires role");

    // Always respond with generic success to avoid account enumeration.
    if (!user || (role && user.role !== role)) {
      return res.json({
        message: "If an account exists, reset instructions have been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    const payload = {
      message: "If an account exists, reset instructions have been sent.",
    };

    // In dev/test, return a reset token so frontend can complete flow without SMTP.
    if (process.env.NODE_ENV !== "production") {
      payload.resetToken = rawToken;
      payload.resetExpiresAt = user.resetPasswordExpires;
    }

    return res.json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const hashedToken = crypto.createHash("sha256").update(String(token)).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    user.password = String(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;