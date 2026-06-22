const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const Game = require('./models/Game');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    try {
      // Find 1 game that is NOT featured currently
      const gameToFeature = await Game.findOne({ isFeatured: { $ne: true } });
      
      if (gameToFeature) {
        gameToFeature.isFeatured = true;
        await gameToFeature.save();
        console.log(`Updated ${gameToFeature.title} to be featured.`);
      } else {
        console.log('No non-featured games found to promote!');
      }
      
      console.log('Done.');
      process.exit(0);
    } catch (err) {
      console.error('Error updating games:', err);
      process.exit(1);
    }
  });
