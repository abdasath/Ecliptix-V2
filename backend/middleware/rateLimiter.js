const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

// Only use Redis for rate limiting if a remote REDIS_URL is provided
const useRedis = process.env.REDIS_URL && !process.env.REDIS_URL.includes('localhost');

// ─────────────────────────────────────────────
// Login Rate Limiter
// Max: 10 attempts per 15 minutes per IP
// ─────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: '⛔ Too many login attempts. Please wait 15 minutes and try again.'
  },
  store: useRedis ? new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:login:',
  }) : undefined,
});

// ─────────────────────────────────────────────
// Register Rate Limiter
// Max: 5 accounts per hour per IP
// ─────────────────────────────────────────────
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: '⛔ Too many accounts created from this IP. Please wait 1 hour.'
  },
  store: useRedis ? new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:register:',
  }) : undefined,
});

// ─────────────────────────────────────────────
// Wallet Rate Limiter
// Max: 10 wallet operations per hour
// Keyed by user ID (not IP) — auth is required
// validate xForwardedForHeader disabled since we use user ID not IP
// ─────────────────────────────────────────────
const walletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: '⛔ Too many wallet requests. Please wait before adding funds again.'
  },
  keyGenerator: (req) => `wallet-${req.user?._id?.toString() || 'anon'}`,
  validate: { xForwardedForHeader: false },
  store: useRedis ? new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:wallet:',
  }) : undefined,
});

module.exports = { loginLimiter, registerLimiter, walletLimiter };
