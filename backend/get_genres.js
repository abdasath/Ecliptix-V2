require('dotenv').config();
const mongoose = require('mongoose');
const Game = require('./models/Game');

mongoose.connect(process.env.MONGODB_URI, {
}).then(async () => {
    const games = await Game.find({});
    let genres = new Set();
    games.forEach(g => {
        g.genres.forEach(genre => genres.add(genre));
    });
    console.log(Array.from(genres).sort());
    process.exit(0);
});
