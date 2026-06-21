const express = require('express');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const router = express.Router();

// ─────────────────────────────────────────────
// Cache Invalidation Helper
// Clears all game-related Redis keys when admin
// creates, updates, or deletes a game
// ─────────────────────────────────────────────
async function invalidateGameCache(gameId = null) {
  try {
    if (redis.status !== 'ready') return;

    const keysToDelete = [
      'games:all:default',
      'games:genres',
      'games:featured',
    ];

    // Also delete the specific game's cache if ID is provided
    if (gameId) {
      keysToDelete.push(`game:${gameId}`);
    }

    await redis.del(...keysToDelete);
    console.log('🗑️  Game cache invalidated:', keysToDelete);
  } catch (err) {
    console.warn('⚠️  Cache invalidation failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// Admin check middleware
// ─────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  // Fallback: allow for demo (same as before)
  next();
};

// Get all games (admin view) — no cache, always fresh
router.get('/games', auth, isAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new game → invalidate cache
router.post('/games', auth, isAdmin, async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();

    // Invalidate all game caches so new game appears immediately
    await invalidateGameCache();

    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update game → invalidate cache
router.put('/games/:id', auth, isAdmin, async (req, res) => {
  try {
    const game = await Game.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Invalidate cache for this specific game + all list caches
    await invalidateGameCache(req.params.id);

    res.json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete game → invalidate cache
router.delete('/games/:id', auth, isAdmin, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Invalidate cache for this specific game + all list caches
    await invalidateGameCache(req.params.id);

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
