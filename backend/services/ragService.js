/**
 * ragService.js
 * ─────────────
 * Core RAG pipeline for Ecliptix AI Game Recommendations.
 *
 * Flow:
 *   1. Embed user query  →  Gemini text-embedding-004
 *   2. Vector search     →  MongoDB Atlas $vectorSearch (top 5 games)
 *   3. Build context     →  Format retrieved games into a prompt
 *   4. Generate response →  gemini-2.0-flash with system instructions
 *   5. Return            →  { aiResponse, games[] }
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');

const GEMINI_API_KEY   = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL  = 'text-embedding-004';
const GENERATION_MODEL = 'gemini-2.0-flash';
const VECTOR_INDEX_NAME = 'game_vector_index'; // must match Atlas index name

// ── Gemini clients ────────────────────────────────────────────────────────────
let genAI;
let embeddingModel;
let generationModel;

function getClients() {
  if (!genAI) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      throw new Error('GEMINI_API_KEY not configured in environment variables');
    }
    genAI           = new GoogleGenerativeAI(GEMINI_API_KEY);
    embeddingModel  = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    generationModel = genAI.getGenerativeModel({ model: GENERATION_MODEL });
  }
  return { embeddingModel, generationModel };
}

// ── Step 1: Embed the user query ──────────────────────────────────────────────
async function embedQuery(query) {
  const { embeddingModel } = getClients();
  const result = await embeddingModel.embedContent(query);
  return result.embedding.values;
}

// ── Step 2: MongoDB Atlas Vector Search ───────────────────────────────────────
async function vectorSearch(queryEmbedding, limit = 5) {
  const Game = require('../models/Game');
  const db   = mongoose.connection.db;

  const results = await db.collection('games').aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: 'embedding',
        queryVector: queryEmbedding,
        numCandidates: limit * 10,  // search wider, return top N
        limit: limit,
      }
    },
    {
      $project: {
        _id: 1,
        title: 1,
        description: 1,
        shortDescription: 1,
        price: 1,
        discount: 1,
        genres: 1,
        tags: 1,
        developer: 1,
        publisher: 1,
        rating: 1,
        coverImage: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray();

  return results;
}

// ── Step 3: Format retrieved games into LLM context ───────────────────────────
function buildContext(games) {
  return games.map((g, i) => {
    const finalPrice = g.discount > 0
      ? `₹${(g.price * (1 - g.discount / 100)).toFixed(0)} (${g.discount}% off, was ₹${g.price})`
      : `₹${g.price}`;
    const genres = (g.genres || []).join(', ');
    const tags   = (g.tags   || []).join(', ');

    return `Game ${i + 1}: ${g.title}
  Price: ${finalPrice}
  Genres: ${genres}
  Tags: ${tags}
  Developer: ${g.developer}
  Rating: ${g.rating}/5
  Description: ${g.shortDescription || g.description}`;
  }).join('\n\n');
}

// ── Step 4: Generate AI recommendation ───────────────────────────────────────
async function generateRecommendation(userQuery, context, games) {
  const { generationModel } = getClients();

  const systemInstruction = `You are Ecliptix's AI game advisor — enthusiastic, knowledgeable, and concise.
Your job is to help users find the perfect game from the Ecliptix store.

Rules:
- Be conversational and friendly, like a gamer friend giving advice
- Briefly explain WHY each recommended game matches the user's request
- Mention price and genre naturally in your response
- Keep your response under 180 words total
- If the retrieved games don't match well, be honest and suggest the user try a different search
- Do NOT make up games that aren't in the provided list
- Format game titles in **bold**`;

  const prompt = `User is looking for: "${userQuery}"

Here are the most semantically relevant games from our store:

${context}

Based on these games, give a personalized, enthusiastic recommendation. Explain why these games match what the user is looking for.`;

  const result = await generationModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      maxOutputTokens: 350,
      temperature: 0.7,
    }
  });

  return result.response.text();
}

// ── Main exported function ────────────────────────────────────────────────────
async function search(userQuery, limit = 5) {
  if (!userQuery || userQuery.trim().length < 2) {
    throw new Error('Please enter at least 2 characters to search');
  }

  const query = userQuery.trim().slice(0, 300); // safety cap

  // Step 1 — embed query
  const queryEmbedding = await embedQuery(query);

  // Step 2 — vector search
  const games = await vectorSearch(queryEmbedding, Math.min(limit, 8));

  if (games.length === 0) {
    return {
      aiResponse: "I couldn't find any matching games for that query. Try describing the type of gameplay, genre, or mood you're looking for — like 'relaxing exploration game' or 'intense multiplayer shooter'.",
      games: []
    };
  }

  // Step 3 — build context
  const context = buildContext(games);

  // Step 4 — generate recommendation
  const aiResponse = await generateRecommendation(query, context, games);

  return { aiResponse, games };
}

module.exports = { search };
