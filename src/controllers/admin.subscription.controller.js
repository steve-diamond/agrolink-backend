const Subscription = require('../../models/Subscription');
const SubscriptionHistory = require('../../models/SubscriptionHistory');
const User = require('../../models/User');
const asyncHandler = require('../utils/asyncHandler');

exports.listAllSubscriptions = asyncHandler(async (_req, res) => {
  const subs = await Subscription.find().populate('user', 'name email role');
  res.status(200).json({ status: 'success', data: subs });
});

exports.listAllSubscriptionHistory = asyncHandler(async (_req, res) => {
  const history = await SubscriptionHistory.find().populate('user', 'name email role').sort('-createdAt');
  res.status(200).json({ status: 'success', data: history });
});

exports.setSubscriptionFee = asyncHandler(async (req, res) => {
  const { fee } = req.body;
  if (typeof fee !== 'number' || fee < 0) return res.status(400).json({ status: 'failed', message: 'Invalid fee' });
  // Save to config (for demo, use env or a config collection)
  process.env.SUBSCRIPTION_FEE = fee;
  res.status(200).json({ status: 'success', fee });
});
