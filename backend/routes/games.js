const express = require('express');
const Game = require('../models/Game');
const router = express.Router();


// 1. GET ALL GAMES (with Filter & Sort)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', genre, sort } = req.query;
    const query = {};

    // Search Logic
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Genre Filter
    if (genre && genre !== 'All Genres') {
      query.genres = genre;
    }



    const total = await Game.countDocuments(query);

    // ✅ NEW: Aggregation-based sorting
    let pipeline = [
      { $match: query },

      // Compute finalPrice = price - discount
      {
        $addFields: {
          finalPrice: {
            $cond: [
              { $gt: ["$discount", 0] },
              {
                $multiply: [
                  "$price",
                  { $subtract: [1, { $divide: ["$discount", 100] }] }
                ]
              },
              "$price"
            ]
          }
        }
      }
    ];

    // Sorting logic
    if (sort === 'priceLowHigh') {
      pipeline.push({ $sort: { finalPrice: 1 } });
    } else if (sort === 'priceHighLow') {
      pipeline.push({ $sort: { finalPrice: -1 } });
    } else if (sort === 'highestRated') {
      pipeline.push({ $sort: { rating: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    );

    // Execute aggregation
    const games = await Game.aggregate(pipeline);


    res.json({
      games,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 2. GET UNIQUE GENRES (Must be BEFORE /:id)
router.get('/meta/genres', async (req, res) => {
  try {
    // Finds all unique genres in the database
    const games = await Game.find({}, 'genres');
    // Flattens the arrays and removes duplicates
    const genres = [...new Set(games.flatMap(g => g.genres))].sort();
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. GET RANDOM FEATURED (Must be BEFORE /:id)
router.get('/featured/random', async (req, res) => {
  try {
    const games = await Game.aggregate([
      { $match: { featured: true } },
      { $sample: { size: 6 } }
    ]);
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// 4. GET FEATURED LIST (Must be BEFORE /:id)
router.get('/featured/list', async (req, res) => {
  try {
    const games = await Game.aggregate([
      { $match: { featured: true } },
      { $sample: { size: 10 } }
    ]);
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 5. GET SINGLE GAME BY ID (Must be LAST)
router.get('/:id', async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate('reviews.user', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    // If ID is invalid format (like "genres"), this catches it
    res.status(500).json({ message: error.message });
  }
});



module.exports = router;

