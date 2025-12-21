const express = require('express');
const Game = require('../models/Game');
const router = express.Router();

router.get('/', async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const total = await Game.countDocuments();
  const games = await Game.find()
    .skip(skip)
    .limit(Number(limit));

  res.json({
    games,
    page: Number(page),
    pages: Math.ceil(total / limit),
    total
  });
});


// GET random featured games (limit = 6)
router.get('/featured/random', async (req, res) => {
  try {
    const games = await Game.aggregate([
      { $match: { featured: true } },
      { $sample: { size: 10 } }   // 👈 RANDOM every request
    ]);

    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single game
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('reviews.user', 'username');
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get featured games
router.get('/featured/list', async (req, res) => {
  try {
    // This is a different way to query than .find()
    const games = await Game.aggregate([
      { $match: { featured: true } },  // 1. Find all featured games
      { $sample: { size: 10 } }      // 2. Randomly pick 10 of them
    ]);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get genres
router.get('/meta/genres', async (req, res) => {
  try {
    const games = await Game.find({}, 'genres');
    const genres = [...new Set(games.flatMap(g => g.genres))];
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

