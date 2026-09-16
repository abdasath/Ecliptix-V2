require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const Game = require('./backend/models/Game');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecliptix', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
    const games = await Game.find({});
    let genres = new Set();
    games.forEach(g => {
        g.genres.forEach(genre => genres.add(genre));
    });
    console.log(Array.from(genres).sort());
    process.exit(0);
});
