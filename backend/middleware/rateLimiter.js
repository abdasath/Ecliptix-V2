const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redis = require('../config/redis');

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
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:login:',
  }),
  skip: () => redis.status !== 'ready',
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
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:register:',
  }),
  skip: () => redis.status !== 'ready',
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
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: 'ratelimit:wallet:',
  }),
  skip: () => redis.status !== 'ready',
});

module.exports = { loginLimiter, registerLimiter, walletLimiter };
