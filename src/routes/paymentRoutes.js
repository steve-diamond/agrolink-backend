const express = require('express');
const router = express.Router();
const {
  initializePayment,
  verifyPayment,
} = require('../controllers/payment.controller');
const { body, param, validate } = require('../../middleware/validation');

router.post('/initialize',
  body('email').isEmail().normalizeEmail(),
  body('amount').isNumeric().toFloat().isFloat({ gt: 0 }),
  body('orderId').isMongoId(),
  body('callback_url').isString().trim().notEmpty(),
  validate,
  initializePayment
);
router.get('/verify/:reference',
  param('reference').isString().trim().notEmpty(),
  validate,
  verifyPayment
);

module.exports = router;
