const express = require('express');
const Game = require('../models/Game');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let query = {};
    let sortOptions = { createdAt: -1 }; // Default sort is newest

    // --- 1. SEARCH AND FILTER LOGIC (Keep existing) ---
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    if (req.query.genre && req.query.genre !== 'All Genres') {
      query.genres = req.query.genre;
    }

    // --- 2. NEW SORTING LOGIC ---
    if (req.query.sort) {
      switch (req.query.sort) {
        case 'newest':
          sortOptions = { createdAt: -1 };
          break;
        case 'price-low':
          // Sort by price ascending (1)
          sortOptions = { price: 1 };
          break;
        case 'price-high':
          // Sort by price descending (-1)
          sortOptions = { price: -1 };
          break;
        case 'rating':
          // Sort by rating descending (-1). Assuming your rating field is 'rating'.
          // If you have a calculated average rating field, use that name instead (e.g., 'avgRating').
          sortOptions = { rating: -1 };
          break;
        default:
          // Use default sort if value is unrecognized or empty
          sortOptions = { createdAt: -1 }; 
      }
    }
    
    // --- 3. PAGINATION AND QUERY EXECUTION ---
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const total = await Game.countDocuments(query);

    const games = await Game.find(query)
      .sort(sortOptions) // <-- ✅ APPLY THE DYNAMIC SORT OBJECT HERE
      .skip(skip)
      .limit(limit);

    res.json({
      games,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
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

