import Redis from 'ioredis';

let client = null;

/**
 * Returns a shared ioredis client.
 * Falls back gracefully if Redis is unavailable – callers must handle null.
 */
const getRedisClient = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }

  if (client) return client;

  const redisUrl = process.env.REDIS_URL;

  client = new Redis(redisUrl, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (times > 5) return null; // stop retrying after 5 attempts
      return Math.min(times * 150, 2000);
    },
  });

  client.on('connect', () => console.log('✓ Redis connected'));
  client.on('error', (err) => console.error('Redis error:', err.message));

  return client;
};

export { getRedisClient };
