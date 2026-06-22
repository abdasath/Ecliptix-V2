const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Game = require('./models/Game');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Find 10 games that do not have featured: true and promote them
      const gamesToFeature = await Game.find({ featured: { $ne: true } }).limit(10);
      
      for (let game of gamesToFeature) {
        game.featured = true;
        await game.save();
        console.log(`Updated ${game.title} to be featured (featured: true).`);
      }
      
      console.log('Done.');
      process.exit(0);
    } catch (err) {
      console.error('Error updating games:', err);
      process.exit(1);
    }
  });
