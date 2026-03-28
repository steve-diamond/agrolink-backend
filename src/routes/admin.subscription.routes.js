const express = require('express');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  listAllSubscriptions,
  listAllSubscriptionHistory,
  setSubscriptionFee,
} = require('../controllers/admin.subscription.controller');

const router = express.Router();

router.get('/subscriptions', protect, authorize('admin'), listAllSubscriptions);
router.get('/subscriptions/history', protect, authorize('admin'), listAllSubscriptionHistory);
router.post('/subscriptions/fee', protect, authorize('admin'), setSubscriptionFee);

module.exports = router;
