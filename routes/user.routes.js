const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth.middleware');
const router = express.Router();

// Get all users (admin only)
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

module.exports = router;
