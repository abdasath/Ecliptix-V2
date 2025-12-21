const express = require('express');
const Game = require('../models/Game');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      genre,
      sort
    } = req.query;

    const query = {};

    // 🔍 SEARCH (title + description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // 🎮 GENRE FILTER
    if (genre && genre !== 'All Genres') {
      query.genres = genre;
    }

    // 🔃 SORTING
    let sortOption = {};
    if (sort === 'priceLowHigh') sortOption.price = 1;
    if (sort === 'priceHighLow') sortOption.price = -1;
    if (sort === 'highestRated') sortOption.rating = -1;
    if (sort === 'newest') sortOption.createdAt = -1;

    const total = await Game.countDocuments(query);

    const games = await Game.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      games,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
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

