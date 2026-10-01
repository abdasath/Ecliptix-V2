const ragService = require('./services/ragService');
require('dotenv').config();

async function run() {
  const result = await ragService.parseUserIntent("i wanna best action games under 699rs");
  console.log(result);
  process.exit(0);
}
run();
