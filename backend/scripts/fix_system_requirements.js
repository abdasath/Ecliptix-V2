const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
require('dotenv').config();
const Game = require('../models/Game');

const updates = {
  // --- HARRY POTTER SERIES ---
  "LEGO Harry Potter: Years 1-4": {
    minimum: { os: "Windows XP/Vista/7/8", processor: "Intel P4 1.8 GHz or AMD Athlon XP 2200+", memory: "1 GB RAM", graphics: "256MB NVIDIA GeForce 5800 / ATI Radeon X1300", storage: "5 GB available space" },
    recommended: { os: "Windows 7/8/10", processor: "Intel Core 2 Duo / AMD Athlon 64 X2 2.0 GHz", memory: "2 GB RAM", graphics: "512MB NVIDIA GeForce 8800 / ATI Radeon HD 3800", storage: "5 GB available space" }
  },
  "LEGO Harry Potter: Years 5-7": {
    minimum: { os: "Windows XP/Vista/7/8", processor: "Intel Core 2 Duo / AMD Athlon 64 X2", memory: "1 GB RAM", graphics: "256MB NVIDIA GeForce 5800 / ATI Radeon X1300", storage: "8.5 GB available space" },
    recommended: { os: "Windows 7/8/10", processor: "Intel Core i5 / AMD Phenom II", memory: "2 GB RAM", graphics: "512MB NVIDIA GeForce GTX 480 / ATI Radeon HD 5850", storage: "8.5 GB available space" }
  },
  "Harry Potter and the Sorcerer's Stone": {
    minimum: { os: "Windows 95/98/ME/2000/XP", processor: "Pentium II 400 MHz", memory: "128 MB RAM", graphics: "16 MB Direct3D Compatible Card", storage: "500 MB available space" }
  },
  "Harry Potter and the Chamber of Secrets": {
    minimum: { os: "Windows 98/ME/2000/XP", processor: "Pentium III 500 MHz", memory: "128 MB RAM", graphics: "32 MB Direct3D Compatible Card", storage: "1 GB available space" }
  },
  "Harry Potter and the Prisoner of Azkaban": {
    minimum: { os: "Windows 98/ME/2000/XP", processor: "Pentium III 600 MHz", memory: "256 MB RAM", graphics: "32 MB GeForce 2 / Radeon 7500", storage: "1 GB available space" }
  },
  "Harry Potter and the Goblet of Fire": {
    minimum: { os: "Windows 2000/XP", processor: "Pentium 4 1.2 GHz", memory: "256 MB RAM", graphics: "64 MB NVIDIA GeForce 3 / ATI Radeon 8500", storage: "2 GB available space" }
  },
  "Harry Potter and the Order of the Phoenix": {
    minimum: { os: "Windows 2000/XP/Vista", processor: "Pentium 4 1.6 GHz", memory: "256 MB RAM (512 MB for Vista)", graphics: "64 MB NVIDIA GeForce 3 / ATI Radeon 8500", storage: "5 GB available space" }
  },
  "Harry Potter and the Half-Blood Prince": {
    minimum: { os: "Windows XP/Vista", processor: "Pentium 4 1.8 GHz", memory: "512 MB RAM", graphics: "64 MB NVIDIA GeForce 6600 / ATI Radeon X600", storage: "5 GB available space" }
  },
  "Harry Potter and the Deathly Hallows – Part 1": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Core 2 Duo E6420 2.13 GHz", memory: "2 GB RAM", graphics: "512 MB NVIDIA GeForce GT 220 / ATI Radeon HD 4650", storage: "7 GB available space" }
  },
  "Harry Potter and the Deathly Hallows – Part 2": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Core 2 Duo E6420 2.13 GHz", memory: "2 GB RAM", graphics: "512 MB NVIDIA GeForce GT 220 / ATI Radeon HD 4650", storage: "7 GB available space" }
  },

  // --- CALL OF DUTY SERIES ---
  "Call of Duty 4: Modern Warfare": {
    minimum: { os: "Windows XP/Vista", processor: "Pentium 4 2.4 GHz / AMD Athlon 64 2800+", memory: "1 GB RAM", graphics: "128MB NVIDIA GeForce 6600 / ATI Radeon 9800 Pro", storage: "8 GB available space" },
    recommended: { os: "Windows XP/Vista/7", processor: "Intel Core 2 Duo 2.4 GHz", memory: "2 GB RAM", graphics: "512MB NVIDIA GeForce 7800 / ATI Radeon X1800", storage: "8 GB available space" }
  },
  "Call of Duty: Modern Warfare 2 (2009)": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Pentium 4 3.2 GHz / AMD Athlon 64 3200+", memory: "1 GB RAM", graphics: "256 MB NVIDIA GeForce 6600GT / ATI Radeon 1600XT", storage: "12 GB available space" }
  },
  "Call of Duty: Modern Warfare 3 (2011)": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Core 2 Duo E6600 / AMD Phenom X3 8750", memory: "2 GB RAM", graphics: "256 MB NVIDIA GeForce 8600GT / ATI Radeon X1950", storage: "16 GB available space" }
  },
  "Call of Duty: World at War": {
    minimum: { os: "Windows XP/Vista/7", processor: "Intel Pentium 4 3.0 GHz / AMD Athlon 64 3200+", memory: "1 GB RAM", graphics: "256MB NVIDIA GeForce 6600GT / ATI Radeon 1600XT", storage: "8 GB available space" }
  },
  "Call of Duty: Black Ops": {
    minimum: { os: "Windows Vista/XP/7", processor: "Intel Core 2 Duo E6600 / AMD Phenom X3 8750", memory: "2 GB RAM", graphics: "256MB NVIDIA GeForce 8600GT / ATI Radeon X1950 Pro", storage: "12 GB available space" }
  },
  "Call of Duty: Black Ops II": {
    minimum: { os: "Windows Vista SP2 / 7", processor: "Intel Core 2 Duo E8200 2.66 GHz / Phenom X3 8750 2.4 GHz", memory: "2 GB RAM (32-bit), 4 GB RAM (64-bit)", graphics: "512MB NVIDIA GeForce 8800GT / ATI Radeon HD 3870", storage: "16 GB available space" }
  },
  "Call of Duty: Black Ops 4": {
    minimum: { os: "Windows 7 (64-bit)", processor: "Intel Core i3-4340 / AMD FX-6300", memory: "8 GB RAM", graphics: "2GB NVIDIA GeForce GTX 660 / Radeon HD 7950", storage: "112 GB available space" },
    recommended: { os: "Windows 10 (64-bit)", processor: "Intel Core i5-2500K / Ryzen R5 1600X", memory: "12 GB RAM", graphics: "4GB NVIDIA GeForce GTX 970 / GTX 1060 / Radeon R9 390", storage: "112 GB available space" }
  },
  "Call of Duty: Black Ops 6": {
    minimum: { os: "Windows 10 (64-bit)", processor: "Intel Core i5-6600 / AMD Ryzen 5 1400", memory: "8 GB RAM", graphics: "2GB NVIDIA GeForce GTX 960 / AMD Radeon RX 470", storage: "149 GB SSD" },
    recommended: { os: "Windows 10/11 (64-bit)", processor: "Intel Core i7-6700K / AMD Ryzen 5 1600X", memory: "16 GB RAM", graphics: "8GB NVIDIA GeForce GTX 1080 Ti / RTX 3060 / AMD Radeon RX 6600XT", storage: "149 GB SSD" }
  },
  "Call of Duty: Modern Warfare (2019)": {
    minimum: { os: "Windows 10 (64-bit)", processor: "Intel Core i3-4340 / AMD FX-6300", memory: "8 GB RAM", graphics: "2GB NVIDIA GeForce GTX 670 / AMD Radeon HD 7950", storage: "175 GB available space" },
    recommended: { os: "Windows 10 (64-bit)", processor: "Intel Core i5-2500K / AMD Ryzen R5 1600X", memory: "12 GB RAM", graphics: "4GB NVIDIA GeForce GTX 970 / GTX 1060 / AMD Radeon R9 390 / RX 580", storage: "175 GB available space" }
  }
};

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB. Fixing missing system requirements for 19 games...');

    let updatedCount = 0;
    for (const [title, reqs] of Object.entries(updates)) {
      const game = await Game.findOne({ title: title });
      if (game) {
        // Apply requirements safely
        game.systemRequirements = {
          minimum: {
            os: reqs.minimum?.os || 'N/A',
            processor: reqs.minimum?.processor || 'N/A',
            memory: reqs.minimum?.memory || 'N/A',
            graphics: reqs.minimum?.graphics || 'N/A',
            storage: reqs.minimum?.storage || 'N/A'
          },
          recommended: reqs.recommended ? {
            os: reqs.recommended?.os || 'N/A',
            processor: reqs.recommended?.processor || 'N/A',
            memory: reqs.recommended?.memory || 'N/A',
            graphics: reqs.recommended?.graphics || 'N/A',
            storage: reqs.recommended?.storage || 'N/A'
          } : undefined
        };
        await game.save();
        console.log(`✅ Fixed requirements for: ${title}`);
        updatedCount++;
      } else {
        console.log(`⚠️ Game not found in DB: ${title}`);
      }
    }
    
    console.log(`\n🎉 Finished! Successfully updated ${updatedCount} games.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
