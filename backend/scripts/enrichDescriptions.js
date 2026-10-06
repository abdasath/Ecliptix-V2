const mongoose = require('mongoose');
const { OpenAI } = require('openai');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const Game = require('../models/Game');

// Initialize Groq via OpenAI client wrapper
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
      model: "openai/gpt-oss-20b",
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
      console.log(`⏳ Rate limited on ${game.title}. Waiting 15 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 15000));
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
    console.log('Connected to DB');

    const priorityTitles = [
      "Harry Potter and the Order of the Phoenix",
      "Call of Duty: Modern Warfare 3 (2011)",
      "LEGO Harry Potter: Years 1-4",
      "LEGO Harry Potter: Years 5-7",
      "Harry Potter and the Sorcerer's Stone",
      "Harry Potter and the Chamber of Secrets",
      "Harry Potter and the Prisoner of Azkaban",
      "Harry Potter and the Goblet of Fire",
      "Harry Potter and the Half-Blood Prince",
      "Harry Potter and the Deathly Hallows – Part 1",
      "Harry Potter and the Deathly Hallows – Part 2",
      "Call of Duty 4: Modern Warfare",
      "Call of Duty: Modern Warfare 2 (2009)",
      "Call of Duty: World at War",
      "Call of Duty: Black Ops",
      "Call of Duty: Black Ops II",
      "Call of Duty: Black Ops 4",
      "Call of Duty: Black Ops 6",
      "Call of Duty: Modern Warfare (2019)"
    ];

    console.log("Fixing priority games first...");
    const priorityGames = await Game.find({ title: { $in: priorityTitles } });
    
    for (let game of priorityGames) {
      if (game.description.split('\n\n').length < 3) {
        await processGame(game);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
      } else {
        console.log(`⏭️ Skipped (Already 3 paragraphs): ${game.title}`);
      }
    }
    
    console.log("\n🎉 Priority games finished! The screenshots you uploaded should now show beautiful 3-paragraph descriptions.");
    console.log("\nTo process the rest of the 800+ games, you can run this script later by removing the title filter!");
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
