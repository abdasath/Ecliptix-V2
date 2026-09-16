require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

// Setup redis if needed to clear cache
const Redis = require('ioredis');
const redisClient = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

const mapping = {
  'Action-Adventure': 'Action Adventure',
  'Action-RPG': 'Action RPG',
  'City-Building': 'City Builder',
  'City Building': 'City Builder',
  'Co-operative': 'Co-op',
  'Cooperative': 'Co-op',
  'First-Person': 'First-Person Shooter',
  'First-person shooter': 'First-Person Shooter',
  'First Person Shooter': 'First-Person Shooter',
  'Free-to-Play': 'Free to Play',
  'Hack-and-Slash': 'Hack and Slash',
  'Historical': 'History', // User mentioned Historical and History
  'Puzzle-platform': 'Puzzle-Platformer',
  'Single-player': 'Single-Player'
};

mongoose.connect(process.env.MONGODB_URI, {
}).then(async () => {
    let updatedCount = 0;
    const games = await Game.find({});
    
    for (let game of games) {
        let changed = false;
        let newGenres = new Set();
        
        for (let genre of game.genres) {
            let normalized = mapping[genre] || genre;
            // Also normalize basic lowercasing issues for identical words
            // Find if there's already an existing normalized one
            if (genre !== normalized) changed = true;
            newGenres.add(normalized);
        }
        
        if (changed || newGenres.size !== game.genres.length) {
            game.genres = Array.from(newGenres);
            await game.save();
            updatedCount++;
        }
    }
    console.log(`Updated ${updatedCount} games!`);
    
    // Clear the genres cache in Redis
    if (redisClient) {
        await redisClient.del('games:genres');
        console.log('Cleared games:genres cache from Redis.');
        redisClient.disconnect();
    }
    process.exit(0);
});
