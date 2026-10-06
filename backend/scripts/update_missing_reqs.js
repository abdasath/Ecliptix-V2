const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); 

const Game = require('../models/Game');

const requirementsMap = {
  "Dead Space 3": {
    minimum: { os: "Windows XP/Vista/7", processor: "2.8 GHz processor or equivalent", memory: "1 GB RAM", graphics: "256 MB NVIDIA GeForce 6800 / ATI X1600 Pro", storage: "10 GB available space" },
    recommended: { os: "Windows 7/8", processor: "Intel Core 2 Quad 2.4 GHz or equivalent", memory: "4 GB RAM", graphics: "1 GB NVIDIA GeForce GTX 260 / ATI Radeon HD 4870", storage: "10 GB available space" }
  },
  "Friday the 13th: The Game": {
    minimum: { os: "Windows 7/8/10 (64-bit)", processor: "Intel Core i3-530 / AMD Athlon II X2 270", memory: "4 GB RAM", graphics: "NVIDIA GeForce GTX 650 Ti / AMD Radeon HD 7770", storage: "40 GB available space" },
    recommended: { os: "Windows 10 (64-bit)", processor: "Intel Core i3-3240 / AMD Athlon X4 860K", memory: "8 GB RAM", graphics: "NVIDIA GeForce GTX 750 Ti / AMD Radeon R9 270X", storage: "40 GB available space" }
  },
  "Call of Duty: Black Ops II": {
    minimum: { os: "Windows Vista SP2 / 7", processor: "Intel Core 2 Duo E8200 2.66 GHz", memory: "2 GB RAM", graphics: "512 MB NVIDIA GeForce 8800GT / ATI Radeon HD 3870", storage: "16 GB available space" },
    recommended: { os: "Windows 7/8", processor: "Intel Core 2 Quad Q6600 2.4 GHz", memory: "4 GB RAM", graphics: "1 GB NVIDIA GeForce GTX 550 Ti / AMD Radeon HD 6870", storage: "16 GB available space" }
  },
  "Call of Duty: Black Ops": {
    minimum: { os: "Windows Vista/XP/7", processor: "Intel Core 2 Duo E6600", memory: "2 GB RAM", graphics: "256 MB NVIDIA GeForce 8600GT / ATI Radeon X1950Pro", storage: "12 GB available space" },
    recommended: { os: "Windows 7", processor: "Intel Core 2 Quad Q6600 2.4 GHz", memory: "4 GB RAM", graphics: "512 MB NVIDIA GeForce GTX 260 / ATI Radeon HD 4870", storage: "12 GB available space" }
  },
  "Call of Duty: World at War": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Pentium 4 3.0 GHz", memory: "512 MB RAM", graphics: "256 MB NVIDIA GeForce 6600GT / ATI Radeon 1600XT", storage: "8 GB available space" },
    recommended: { os: "Windows 7", processor: "Intel Core 2 Duo 2.0 GHz", memory: "1 GB RAM", graphics: "512 MB NVIDIA GeForce 8800GT / ATI Radeon HD 3870", storage: "8 GB available space" }
  },
  "Call of Duty: Modern Warfare 3 (2011)": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Core 2 Duo E6600", memory: "2 GB RAM", graphics: "256 MB NVIDIA GeForce 8600GT / ATI Radeon X1950", storage: "16 GB available space" },
    recommended: { os: "Windows 7", processor: "Intel Core 2 Duo E6850 3.0 GHz", memory: "4 GB RAM", graphics: "512 MB NVIDIA GeForce GTX 260 / ATI Radeon HD 4870", storage: "16 GB available space" }
  },
  "Call of Duty: Modern Warfare 2 (2009)": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Pentium 4 3.2 GHz", memory: "1 GB RAM", graphics: "256 MB NVIDIA GeForce 6600GT / ATI Radeon 1600XT", storage: "12 GB available space" },
    recommended: { os: "Windows 7", processor: "Intel Core 2 Duo 2.4 GHz", memory: "2 GB RAM", graphics: "512 MB NVIDIA GeForce 8800GT / ATI Radeon HD 3870", storage: "12 GB available space" }
  },
  "Harry Potter and the Deathly Hallows – Part 1": {
    minimum: { os: "Windows XP/Vista/7", processor: "2.4 GHz Core 2 Duo", memory: "1.5 GB RAM", graphics: "256 MB NVIDIA GeForce 8600 / ATI Radeon HD 2600", storage: "5 GB available space" },
    recommended: { os: "Windows 7", processor: "2.8 GHz Core 2 Duo", memory: "2 GB RAM", graphics: "512 MB NVIDIA GeForce 9800 / ATI Radeon HD 4870", storage: "5 GB available space" }
  },
  "Harry Potter and the Half-Blood Prince": {
    minimum: { os: "Windows XP/Vista", processor: "1.8 GHz Pentium 4", memory: "512 MB RAM", graphics: "64 MB NVIDIA GeForce 6600 / ATI Radeon X1300", storage: "5 GB available space" },
    recommended: { os: "Windows XP/Vista", processor: "Intel Core 2 Duo 2.0 GHz", memory: "1 GB RAM", graphics: "256 MB NVIDIA GeForce 8600 / ATI Radeon HD 2600", storage: "5 GB available space" }
  },
  "Harry Potter and the Order of the Phoenix": {
    minimum: { os: "Windows 2000/XP/Vista", processor: "1.6 GHz Pentium 4", memory: "256 MB RAM", graphics: "64 MB NVIDIA GeForce 6600 / ATI Radeon X1300", storage: "5 GB available space" },
    recommended: { os: "Windows XP/Vista", processor: "2.0 GHz Pentium 4", memory: "512 MB RAM", graphics: "128 MB NVIDIA GeForce 7600 / ATI Radeon X1600", storage: "5 GB available space" }
  },
  "Harry Potter and the Goblet of Fire": {
    minimum: { os: "Windows 2000/XP", processor: "1.2 GHz Pentium 3", memory: "256 MB RAM", graphics: "32 MB Direct3D compatible video card", storage: "1.2 GB available space" },
    recommended: { os: "Windows XP", processor: "1.5 GHz Pentium 4", memory: "512 MB RAM", graphics: "64 MB NVIDIA GeForce 4 Ti / ATI Radeon 9000", storage: "1.2 GB available space" }
  },
  "Harry Potter and the Prisoner of Azkaban": {
    minimum: { os: "Windows 98/ME/2000/XP", processor: "600 MHz Pentium 3", memory: "256 MB RAM", graphics: "32 MB Direct3D compatible video card", storage: "850 MB available space" },
    recommended: { os: "Windows XP", processor: "1.0 GHz Pentium 3", memory: "512 MB RAM", graphics: "64 MB Direct3D compatible video card", storage: "850 MB available space" }
  },
  "Harry Potter and the Chamber of Secrets": {
    minimum: { os: "Windows 98/ME/2000/XP", processor: "300 MHz Pentium 2", memory: "64 MB RAM", graphics: "8 MB Direct3D compatible video card", storage: "600 MB available space" },
    recommended: { os: "Windows XP", processor: "500 MHz Pentium 3", memory: "128 MB RAM", graphics: "16 MB Direct3D compatible video card", storage: "600 MB available space" }
  },
  "Harry Potter and the Sorcerer's Stone": {
    minimum: { os: "Windows 95/98/ME/2000/XP", processor: "266 MHz Pentium 2", memory: "32 MB RAM", graphics: "4 MB Direct3D compatible video card", storage: "500 MB available space" },
    recommended: { os: "Windows XP", processor: "400 MHz Pentium 2", memory: "64 MB RAM", graphics: "8 MB Direct3D compatible video card", storage: "500 MB available space" }
  }
};

async function fixReqs() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB. Fixing missing requirements...');
  
  for (const [title, reqs] of Object.entries(requirementsMap)) {
    const game = await Game.findOne({ title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } });
    if (game) {
      if (!game.systemRequirements) game.systemRequirements = {};
      game.systemRequirements.minimum = reqs.minimum;
      game.systemRequirements.recommended = reqs.recommended;
      
      await game.save();
      console.log(`✅ Updated: ${title}`);
    } else {
      console.log(`⚠️ Not found in DB: ${title}`);
    }
  }
  
  console.log('Done.');
  process.exit(0);
}

fixReqs();
