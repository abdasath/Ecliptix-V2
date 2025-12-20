const express = require('express');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const router = express.Router();

// Middleware to check if user is admin (simple check - you can enhance this)
const isAdmin = (req, res, next) => {
  // For demo purposes, we'll allow any authenticated user to be admin
  // In production, add an 'isAdmin' field to User model
  next();
};

// Get all games (admin view)
router.get('/games', auth, isAdmin, async (req, res) => {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new game
router.post('/games', auth, isAdmin, async (req, res) => {
  try {
    const game = new Game(req.body);
    await game.save();
    res.status(201).json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update game
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
    
    res.json(game);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete game
router.delete('/games/:id', auth, isAdmin, async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

