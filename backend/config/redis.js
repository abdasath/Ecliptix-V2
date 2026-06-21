const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  // Retry strategy — if Redis is down, don't crash the server
  retryStrategy(times) {
    if (times > 3) {
      console.error('Redis: Max retries reached. Running without cache.');
      return null; // stop retrying
    }
    return Math.min(times * 200, 1000);
  },
  // Suppress error events so the app doesn't crash if Redis goes offline
  lazyConnect: false,
  enableOfflineQueue: false,
});

redis.on('connect', () => {
  console.log('✅ Redis Connected: localhost:6379');
});

redis.on('error', (err) => {
  console.warn('⚠️  Redis Error (app still works without cache):', err.message);
});

redis.on('ready', () => {
  console.log('🚀 Redis Ready');
});

module.exports = redis;
