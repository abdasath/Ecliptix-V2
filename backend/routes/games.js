const express = require('express');
const Game = require('../models/Game');
const redis = require('../config/redis');
const router = express.Router();

// ─────────────────────────────────────────────
// Cache TTLs (seconds)
// ─────────────────────────────────────────────
const CACHE_TTL = {
  GAMES_LIST:   5 * 60,   // 5 minutes
  GENRES:       30 * 60,  // 30 minutes
  FEATURED:     5 * 60,   // 5 minutes
  SINGLE_GAME:  10 * 60,  // 10 minutes
};

// Helper: safe Redis get (graceful fallback if Redis offline)
async function cacheGet(key) {
  try {
    if (redis.status !== 'ready') return null;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

// Helper: safe Redis set
async function cacheSet(key, data, ttl) {
  try {
    if (redis.status !== 'ready') return;
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {}
}

// ─────────────────────────────────────────────
// 1. GET ALL GAMES (with Filter & Sort)
//    Only caches the default/first page (no filters)
//    Dynamic filters/search always hit DB
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', genre, sort } = req.query;

    // Only cache unfiltered first page requests
    const isDefaultQuery = !search && !genre && !sort && Number(page) === 1;
    if (isDefaultQuery) {
      const cached = await cacheGet('games:all:default');
      if (cached) {
        console.log('⚡ Cache HIT: games:all:default');
        return res.json(cached);
      }
    }

    const query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (genre && genre !== 'All Genres') {
      query.genres = genre;
    }

    const total = await Game.countDocuments(query);

    let pipeline = [
      { $match: query },
      {
        $addFields: {
          finalPrice: {
            $cond: [
              { $gt: ['$discount', 0] },
              {
                $multiply: [
                  '$price',
                  { $subtract: [1, { $divide: ['$discount', 100] }] }
                ]
              },
              '$price'
            ]
          }
        }
      }
    ];

    if (sort === 'priceLowHigh') {
      pipeline.push({ $sort: { finalPrice: 1 } });
    } else if (sort === 'priceHighLow') {
      pipeline.push({ $sort: { finalPrice: -1 } });
    } else if (sort === 'highestRated') {
      pipeline.push({ $sort: { rating: -1 } });
    } else {
      pipeline.push({ $sort: { createdAt: -1 } });
    }

    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: Number(limit) }
    );

    const games = await Game.aggregate(pipeline);
    const response = { games, page: Number(page), totalPages: Math.ceil(total / limit) };

    // Cache only default query results
    if (isDefaultQuery) {
      await cacheSet('games:all:default', response, CACHE_TTL.GAMES_LIST);
      console.log('💾 Cache SET: games:all:default');
    }

    res.json(response);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// 2. GET UNIQUE GENRES (Must be BEFORE /:id)
//    Cached 30 min — genres rarely change
// ─────────────────────────────────────────────
router.get('/meta/genres', async (req, res) => {
  try {
    const cached = await cacheGet('games:genres');
    if (cached) {
      console.log('⚡ Cache HIT: games:genres');
      return res.json(cached);
    }

    const games = await Game.find({}, 'genres');
    const genres = [...new Set(games.flatMap(g => g.genres))].sort();

    await cacheSet('games:genres', genres, CACHE_TTL.GENRES);
    console.log('💾 Cache SET: games:genres');

    res.json(genres);
  } catch (error) {
    console.error('Games route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 3. GET RANDOM FEATURED (Must be BEFORE /:id)
//    NOT cached — random by design ($sample)
// ─────────────────────────────────────────────
router.get('/featured/random', async (req, res) => {
  try {
    const games = await Game.aggregate([
      { $match: { featured: true } },
      { $sample: { size: 16 } }
    ]);
    res.json(games);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─────────────────────────────────────────────
// 4. GET FEATURED LIST (Must be BEFORE /:id)
//    Cached 5 min
// ─────────────────────────────────────────────
router.get('/featured/list', async (req, res) => {
  try {
    const cached = await cacheGet('games:featured');
    if (cached) {
      console.log('⚡ Cache HIT: games:featured');
      return res.json(cached);
    }

    const games = await Game.aggregate([
      { $match: { featured: true } },
      { $sample: { size: 10 } }
    ]);

    await cacheSet('games:featured', games, CACHE_TTL.FEATURED);
    console.log('💾 Cache SET: games:featured');

    res.json(games);
  } catch (error) {
    console.error('Games route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 5. GET SINGLE GAME BY ID (Must be LAST)
//    Cached 10 min per game ID
// ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const cacheKey = `game:${req.params.id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      console.log(`⚡ Cache HIT: ${cacheKey}`);
      return res.json(cached);
    }

    const game = await Game.findById(req.params.id)
      .populate('reviews.user', 'username');

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    await cacheSet(cacheKey, game, CACHE_TTL.SINGLE_GAME);
    console.log(`💾 Cache SET: ${cacheKey}`);

    res.json(game);
  } catch (error) {
    console.error('Games route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
