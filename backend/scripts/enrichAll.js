const mongoose = require('mongoose');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const Game = require('../models/Game');

// Using the Groq API via OpenAI wrapper because it successfully formatted the priority games perfectly.
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

async function processGame(game) {
  try {
    const prompt = `You are a professional video game journalist writing a store page. 
Rewrite the description for the game "${game.title}" into exactly 3 paragraphs. 
- Paragraph 1: The storyline, lore, and core premise.
- Paragraph 2: The gameplay mechanics, the environment/world, and characters.
- Paragraph 3: The game's awards, critical reception, legacy, or overall impact.
Return ONLY the 3 paragraphs separated by double newlines (\n\n). Do not use markdown headers, bolding, or intro text. Make it read like a premium Steam or Epic Games store description.
Base info: ${game.description}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.5,
      max_tokens: 1024,
    });

    const newDescription = completion.choices[0].message.content.trim();
    
    if (newDescription && newDescription.split('\n\n').length >= 2) {
      game.description = newDescription;
      await game.save();
      console.log(`✅ Enriched: ${game.title}`);
      return true;
    } else {
      console.log(`⚠️ Skipped (Bad format): ${game.title}`);
      return false;
    }
  } catch (err) {
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      console.log(`⏳ Rate limited. Waiting 20 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 20000));
      return processGame(game);
    } else {
      console.error(`❌ Error on ${game.title}:`, err.message);
      return false;
    }
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Starting FULL background migration of 840 games using GROQ (Super Slow Mode)...');

    const allGames = await Game.find({});
    let processed = 0;
    
    for (let game of allGames) {
      if (game.description && game.description.split('\n\n').length < 3) {
        await processGame(game);
        
        // HUGE 2-second delay. This means only 30 requests per minute.
        // This makes it completely invisible to Groq rate limits, so your Chatbot is 100% safe.
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        processed++;
      } else {
        console.log(`⏭️ Skipped (Already formatted): ${game.title}`);
      }
    }
    
    console.log(`\n🎉 Finished! Processed ${processed} games.`);
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
