const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const games = await db.collection('games').find({}, { projection: { title: 1 } }).toArray();
  console.log(games.map(g => g.title).join('\n'));
  process.exit(0);
}
run();
