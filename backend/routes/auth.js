const express = require('express');
const dns = require('dns').promises;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

// The Google Client ID passed securely from env
// e.g. process.env.GOOGLE_CLIENT_ID
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────────
// Register
// Rate limited: 5 registrations per IP per hour
// ─────────────────────────────────────────────
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    // ─── Simple Email Domain Validation (Block Fake Domains) ───
    try {
      const domain = email.split('@')[1];
      if (!domain) {
        return res.status(400).json({ message: 'Invalid email format' });
      }
      // Look up MX (Mail Exchange) records for the domain
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({ message: 'Fake or invalid email domain detected. Please use a real email.' });
      }
    } catch (err) {
      // If DNS lookup fails entirely (e.g. domain doesn't exist), block it
      return res.status(400).json({ message: 'Fake or invalid email domain detected. Please use a real email.' });
    }
    // ───────────────────────────────────────────────────────────

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// Login
// Rate limited: 10 attempts per IP per 15 min
// ─────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wallet: user.wallet,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// Logout
// Blacklists the JWT in Redis until it expires
// ─────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.token;

    // Calculate remaining TTL of the JWT so Redis auto-expires it
    const decoded = jwt.decode(token);
    const now = Math.floor(Date.now() / 1000);
    const ttl = decoded.exp - now; // seconds remaining

    if (ttl > 0 && redis.status === 'ready') {
      await redis.setex(`blacklist:${token}`, ttl, '1');
      console.log(`🚫 Token blacklisted for ${ttl}s`);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─────────────────────────────────────────────
// Google OAuth Login / Register
// ─────────────────────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'No Google credential provided' });
    }

    // Verify the JWT securely with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });

    const payload = ticket.getPayload();
    // Google payload contains: email, name, sub (unique Google ID), picture
    const { email, name, sub: googleId } = payload;

    // 1. Check if user already exists
    let user = await User.findOne({ email });

    if (!user) {
      // 2. Register them automatically
      // We generate a clean username from their name + a random number to avoid collisions
      const baseUsername = name.replace(/\s+/g, '').slice(0, 15);
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      user = await User.create({
        username: `${baseUsername}${randomNum}`,
        email: email,
        googleId: googleId,
        // password is omitted because schema allows it if googleId is present
      });
    } else if (!user.googleId) {
      // If user exists but hasn't linked Google yet, link it now
      user.googleId = googleId;
      await user.save();
    }

    // 3. Log them in (create session JWT)
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        wallet: user.wallet,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401).json({ message: 'Invalid Google token' });
  }
});

// ─────────────────────────────────────────────
// Get current user
// ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('ownedGames', 'title coverImage');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
