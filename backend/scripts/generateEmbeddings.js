/**
 * generateEmbeddings.js
 * ─────────────────────
 * One-time script: generates Gemini text-embedding-004 vectors for every game
 * and stores them as `embedding: [...]` on each game document in MongoDB.
 *
 * Run once: node backend/scripts/generateEmbeddings.js
 * Re-run anytime you add new games to the database.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

// ── Config ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const MONGODB_URI      = process.env.MONGODB_URI;

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY not set in .env');
  process.exit(1);
}

// ── Gemini client ────────────────────────────────────────────────────────────
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// ── Game model require moved down below to avoid duplicate declaration ────────
const Game = require('../models/Game');

// ── Generate embedding for a single text ─────────────────────────────────────
async function generateEmbedding(text) {
  const result = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text
  });
  return result.embeddings[0].values; // array of 3072 floats
}



// ── Build text blob for embedding ────────────────────────────────────────────
function buildGameText(game) {
  const genres = (game.genres || []).join(', ');
  const tags   = (game.tags   || []).join(', ');
  const price  = game.discount > 0
    ? `₹${(game.price * (1 - game.discount / 100)).toFixed(0)} (${game.discount}% off from ₹${game.price})`
    : `₹${game.price}`;

  return [
    `Title: ${game.title}`,
    `Developer: ${game.developer}`,
    `Publisher: ${game.publisher}`,
    `Genres: ${genres}`,
    `Tags: ${tags}`,
    `Price: ${price}`,
    `Description: ${game.description}`,
    `Short Description: ${game.shortDescription}`,
    `Rating: ${game.rating}/5`,
  ].join('\n');
}

// ── Sleep to respect rate limits ─────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected\n');

  // Fetch all games (include embedding field to skip already embedded ones)
  const games = await Game.find({}).select('+embedding');
  console.log(`📦 Found ${games.length} games total\n`);

  let embedded = 0;
  let skipped  = 0;
  let failed   = 0;

  for (const game of games) {
    // Skip if already has a valid embedding
    if (game.embedding && game.embedding.length === 3072) {
      console.log(`⏩ Skipping "${game.title}" (already embedded)`);
      skipped++;
      continue;
    }

    try {
      process.stdout.write(`🔄 Embedding "${game.title}"...`);
      const text      = buildGameText(game);
      const embedding = await generateEmbedding(text);

      await Game.updateOne({ _id: game._id }, { $set: { embedding } });
      console.log(` ✅ (${embedding.length} dims)`);
      embedded++;

      // Rate-limit: free tier allows 1,500 RPM for embeddings — 100ms gap is safe
      await sleep(100);

    } catch (err) {
      console.error(` ❌ Failed: ${err.message}`);
      failed++;
      await sleep(2000); // longer pause on error
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Embedded: ${embedded}`);
  console.log(`⏩ Skipped (already done): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('─────────────────────────────────────');

  if (embedded > 0) {
    console.log('\n🎉 Done! Now create your MongoDB Atlas Vector Index if you haven\'t already.');
    console.log('   See: README or implementation_plan.md for the JSON to use.\n');
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
