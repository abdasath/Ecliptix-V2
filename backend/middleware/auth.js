const jwt = require('jsonwebtoken');
const User = require('../models/User');
const redis = require('../config/redis');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // ─────────────────────────────────────────────
    // Redis JWT Blacklist Check
    // If user has logged out, their token is stored
    // in Redis with prefix "blacklist:{token}"
    // ─────────────────────────────────────────────
    try {
      if (redis.status === 'ready') {
        const isBlacklisted = await redis.get(`blacklist:${token}`);
        if (isBlacklisted) {
          return res.status(401).json({ message: 'Session expired. Please login again.' });
        }
      }
    } catch (redisErr) {
      // Redis check failed — allow request to continue (graceful fallback)
      console.warn('⚠️  Redis blacklist check failed:', redisErr.message);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    req.token = token; // Attach token for logout route
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;
