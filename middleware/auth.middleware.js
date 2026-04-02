const jwt = require('jsonwebtoken');
const path = require('path');
const User = require(path.join(__dirname, '../models/User'));
const asyncHandler = require(path.join(__dirname, '../utils/asyncHandler'));
const ApiError = require(path.join(__dirname, '../utils/apiError'));
const { getRedisClient } = require('../config/cache');

// 5-minute TTL keeps the cache fresh while absorbing burst traffic.
const USER_CACHE_TTL_SECONDS = 300;
const USER_CACHE_KEY = (id) => `user:${id}`;

const getCachedUser = async (userId) => {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const raw = await redis.get(USER_CACHE_KEY(userId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // Redis down — fall through to DB
  }
};

const setCachedUser = async (userId, user) => {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.setex(
      USER_CACHE_KEY(userId),
      USER_CACHE_TTL_SECONDS,
      JSON.stringify(user),
    );
  } catch {
    // non-fatal
  }
};

/** Call this whenever a user is deleted/banned to purge from cache immediately. */
const invalidateUserCache = async (userId) => {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.del(USER_CACHE_KEY(userId));
  } catch {
    // non-fatal
  }
};

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';

  if (!authHeader) {
    throw new ApiError(401, 'Authorization token is required.');
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  if (!process.env.JWT_SECRET) {
    throw new ApiError(500, 'JWT_SECRET is not configured.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired token.');
  }

  // Try Redis cache first – avoids a DB round-trip on every request.
  let user = await getCachedUser(decoded.id);

  if (!user) {
    user = await User.findById(decoded.id).select('-password').lean();
    if (!user) {
      throw new ApiError(401, 'The user associated with this token no longer exists.');
    }
    await setCachedUser(decoded.id, user);
  }

  req.user = user;
  next();
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(new ApiError(401, 'Not authenticated.'));
  }

  if (!roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action.'));
  }

  return next();
};

module.exports = {
  protect,
  authorize,
  invalidateUserCache,
};
