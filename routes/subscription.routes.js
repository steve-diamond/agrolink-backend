const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  initializeSubscription,
  verifySubscription,
  getMySubscription,
} = require('../controllers/subscription.controller');
const path = require('path');
const { body, param, validate } = require(path.join(__dirname, '../middleware/validation'));

const router = express.Router();

router.post('/initialize',
  protect,
  body('email').isEmail().normalizeEmail(),
  body('amount').isNumeric().toFloat().isFloat({ gt: 0 }),
  body('callback_url').isString().trim().notEmpty(),
  validate,
  initializeSubscription
);
router.get('/verify/:reference',
  protect,
  param('reference').isString().trim().notEmpty(),
  validate,
  verifySubscription
);
router.get('/me', protect, getMySubscription);

module.exports = router;
