/**
 * routes/rag.js
 * ─────────────
 * AI Game Recommendation endpoints.
 *
 * GET  /api/rag/search?q=your+query&limit=5  →  AI response + game cards
 * POST /api/rag/index                         →  (admin) trigger embedding generation
 */

const express = require('express');
const router  = express.Router();
const ragService = require('../services/ragService');
const auth    = require('../middleware/auth');
const redis   = require('../config/redis');

const CACHE_TTL_SECONDS = 3600; // 1 hour cache for repeated queries
const AI_ERROR_RESPONSE = 'The AI service is temporarily unavailable. Please try again in a moment.';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rag/search?q=...&limit=5
// Main search endpoint — Redis cached
// ─────────────────────────────────────────────────────────────────────────────
router.get('/search', auth, async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ message: 'Please enter at least 2 characters to search' });
  }

  const query     = q.trim().toLowerCase();
  const cacheKey  = `rag:search:${query}:${limit}`;

  // ── Try Redis cache first ──
  try {
    if (redis.status === 'ready') {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log(`🔵 RAG cache hit: "${query}"`);
        return res.json({ ...JSON.parse(cached), cached: true });
      }
    }
  } catch (cacheErr) {
    console.warn('Redis cache read failed:', cacheErr.message);
  }

  // ── Run RAG pipeline ──
  try {
    console.log(`🤖 RAG search: "${query}"`);
    const sessionId = req.user.id;
    const result = await ragService.search(q.trim(), parseInt(limit), sessionId);

    const response = {
      type: result.type,
      query: q.trim(),
      aiResponse: result.aiResponse,
      games: result.games,
      cached: false
    };

    // ── Cache result in Redis (skip caching AI failures or empty responses) ──
    try {
      if (redis.status === 'ready' && result.aiResponse && result.aiResponse !== AI_ERROR_RESPONSE) {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(response));
        console.log(`🟢 RAG result cached for 1h: "${query}"`);
      } else if (!result.aiResponse || result.aiResponse === AI_ERROR_RESPONSE) {
        console.warn(`🟡 RAG response NOT cached (empty or error): "${query}"`);
      }
    } catch (cacheWriteErr) {
      console.warn('Redis cache write failed:', cacheWriteErr.message);
    }

    res.json(response);

  } catch (error) {
    console.error('RAG search error:', error.message);

    if (error.message.includes('GEMINI_API_KEY')) {
      return res.status(503).json({ message: 'AI service not configured. Please contact admin.' });
    }
    if (error.message.includes('vectorSearch') || error.message.includes('index')) {
      return res.status(503).json({ message: 'Vector search index not ready. Please run the indexing script first.' });
    }

    res.status(500).json({ message: 'AI recommendation failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/rag/index   (admin only)
// Triggers the embedding generation for all un-embedded games
// ─────────────────────────────────────────────────────────────────────────────
router.post('/index', auth, async (req, res) => {
  // Only admin can trigger re-indexing
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  res.json({ message: 'Indexing started in background. Check server logs for progress.' });

  // Run indexing after response is sent
  setImmediate(async () => {
    try {
      const { execFile } = require('child_process');
      const path = require('path');
      const scriptPath = path.join(__dirname, '../scripts/generateEmbeddings.js');
      execFile('node', [scriptPath], (error, stdout, stderr) => {
        if (error) console.error('Indexing error:', error.message);
        if (stdout) console.log('Indexing output:', stdout);
        if (stderr) console.error('Indexing stderr:', stderr);
      });
    } catch (err) {
      console.error('Failed to start indexing:', err.message);
    }
  });
});

module.exports = router;
