const express = require('express');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const router = express.Router();

// Helper to gracefully parse DD/MM/YYYY or DD-MM-YYYY date strings 
// that normally cause native JS Date parsers to throw CastErrors.
function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return dateStr;
  const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

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
// AI Indexing Helper
// Triggers the Gemini embedding script in the
// background so new games become searchable
// ─────────────────────────────────────────────
function triggerAIIndexing() {
  setImmediate(() => {
    try {
      const { execFile } = require('child_process');
      const path = require('path');
      const scriptPath = path.join(__dirname, '../scripts/generateEmbeddings.js');
      console.log('🤖 Triggering background AI indexing for new/updated game...');
      execFile('node', [scriptPath], (error, stdout, stderr) => {
        if (error) console.error('⚠️ Indexing error:', error.message);
        if (stdout) console.log(stdout.trim());
      });
    } catch (err) {
      console.error('⚠️ Failed to start indexing:', err.message);
    }
  });
}

// ─────────────────────────────────────────────
// Admin check middleware
// ─────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  console.warn(`⛔ Admin access denied for ${req.user ? req.user._id : 'unauthenticated'}`);
  return res.status(403).json({ message: 'Access denied. Admin only.' });
};

// Get all games (admin view) — no cache, always fresh
router.get('/games', auth, isAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    console.error('Ecliptix route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// Create new game → invalidate cache
router.post('/games', auth, isAdmin, async (req, res) => {
  try {
    if (req.body.releaseDate) {
      req.body.releaseDate = parseDateString(req.body.releaseDate);
    }

    const { title } = req.body;
    
    // Check for exact duplicate name (case-insensitive)
    if (title) {
      const existingGame = await Game.findOne({ 
        title: { $regex: new RegExp(`^${title}$`, 'i') } 
      });
      if (existingGame) {
        return res.status(400).json({ message: 'This game is already existed' });
      }
    }

    const game = new Game(req.body);
    await game.save();

    // Invalidate all game caches so new game appears immediately
    await invalidateGameCache();
    triggerAIIndexing();

    res.status(201).json(game);
  } catch (error) {
    console.error('Create/update game error:', error);
    res.status(400).json({ message: 'Invalid input data. Please check your fields.' });
  }
});

// Update game → invalidate cache
router.put('/games/:id', auth, isAdmin, async (req, res) => {
  try {
    if (req.body.releaseDate) {
      req.body.releaseDate = parseDateString(req.body.releaseDate);
    }

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
    triggerAIIndexing();

    res.json(game);
  } catch (error) {
    console.error('Create/update game error:', error);
    res.status(400).json({ message: 'Invalid input data. Please check your fields.' });
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
    console.error('Ecliptix route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
// Test hook: exported so security unit-tests can verify the admin boundary
module.exports.isAdmin = isAdmin;
