const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Game = require('./models/Game');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB Connected.');
    try {
      // Find 5 games that are NOT featured currently
      const gamesToFeature = await Game.find({ isFeatured: { $ne: true } }).limit(5);
      
      for (let game of gamesToFeature) {
        game.isFeatured = true;
        await game.save();
        console.log(`Updated ${game.title} to be featured.`);
      }
      
      console.log('Done updating featured games.');
      process.exit(0);
    } catch (err) {
      console.error('Error updating games:', err);
      process.exit(1);
    }
  });
