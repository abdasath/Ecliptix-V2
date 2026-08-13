const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Game = require('../models/Game');

dotenv.config({ path: __dirname + '/../.env' });

// Delay helper to avoid hitting Steam API rate limits (200 requests per 5 minutes)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function upgradeImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');
    
    // Find ONLY the games where the images array contains the low-res 'header.jpg'
    // This safely ignores all your 291 original games which already have good images!
    const games = await Game.find({ 
      images: { $regex: /header\.jpg$/ } 
    });
    console.log(`📦 Found ${games.length} games with Steam IDs to upgrade...`);

    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      
      // Extract the Steam App ID using Regex
      const match = game.coverImage.match(/apps\/(\d+)/);
      if (!match) continue;
      
      const appId = match[1];
      
      try {
        process.stdout.write(`🔄 [${i+1}/${games.length}] Upgrading "${game.title}" (AppID: ${appId})... `);
        
        // Fetch full app details from official Steam API
        const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}`);
        const json = await response.json();
        
        if (json[appId] && json[appId].success && json[appId].data) {
          const data = json[appId].data;
          
          let updated = false;

          // 1. Upgrade the images array to use stunning 1080p full-res screenshots!
          if (data.screenshots && data.screenshots.length > 0) {
            // Grab up to 6 high-res 1920x1080 screenshots
            game.images = data.screenshots.slice(0, 6).map(s => s.path_full);
            updated = true;
          }

          // 2. Upgrade the coverImage to a higher resolution capsule
          // header.jpg is 460x215. capsule_616x353.jpg is 616x353 (much sharper for grids)
          const newCover = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appId}/capsule_616x353.jpg`;
          if (game.coverImage !== newCover) {
            game.coverImage = newCover;
            updated = true;
          }

          if (updated) {
            await game.save();
            updatedCount++;
            console.log(`✅ Upgraded to 1080p HD!`);
          } else {
            console.log(`⏭️ Already high-res.`);
          }
        } else {
          console.log(`❌ Steam API returned no data for this ID.`);
          errorCount++;
        }
      } catch (err) {
        console.log(`❌ Error fetching data: ${err.message}`);
        errorCount++;
      }

      // Wait 1.5 seconds between each request so Steam doesn't ban us for spamming
      await delay(1500);
    }

    console.log(`\n🎉 FINISHED! Successfully upgraded images for ${updatedCount} games!`);
    if (errorCount > 0) {
      console.log(`⚠️ Note: ${errorCount} games failed to fetch from Steam (likely delisted games).`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

upgradeImages();
