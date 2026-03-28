const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  initializeSubscription,
  verifySubscription,
  getMySubscription,
} = require('../controllers/subscription.controller');

const router = express.Router();

router.post('/initialize', protect, initializeSubscription);
router.get('/verify/:reference', protect, verifySubscription);
router.get('/me', protect, getMySubscription);

module.exports = router;
