const Subscription = require('../../models/Subscription');
const ApiError = require('../utils/apiError');

// Middleware to check if user has an active subscription
module.exports = async function ensureActiveSubscription(req, res, next) {
  const userId = req.user && req.user._id;
  if (!userId) {
    return next(new ApiError(401, 'User not authenticated'));
  }
  const subscription = await Subscription.findOne({ user: userId, status: 'active', endDate: { $gt: new Date() } });
  if (!subscription) {
    return next(new ApiError(403, 'Active subscription required to list products'));
  }
  next();
};
