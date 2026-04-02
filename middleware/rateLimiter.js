const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient } = require('../config/cache');

const buildLimiter = () => {
	let store;
	try {
		const redis = getRedisClient();
		if (redis) {
			// RedisStore uses a single INCR-based counter per key – O(1), very fast.
			store = new RedisStore({
				sendCommand: (...args) => redis.call(...args),
			});
		}
	} catch {
		// Redis unavailable at startup – degrade gracefully to in-memory store.
		store = undefined;
	}

	return rateLimit({
		windowMs: 15 * 60 * 1000,
		max: 200, // generous for authenticated multi-role users
		standardHeaders: true,
		legacyHeaders: false,
		store,
		message: {
			status: 'error',
			message: 'Too many requests, please try again later.',
		},
	});
};

module.exports = buildLimiter();
