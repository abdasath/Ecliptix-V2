const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Game = require('./models/Game');

dotenv.config();

const newGames = [
  {
    title: "Baldur's Gate 3",
    shortDescription: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival.",
    description: "Baldur's Gate 3 is a story-rich, party-based RPG set in the universe of Dungeons & Dragons, where your choices shape a tale of fellowship and betrayal.",
    price: 2999,
    discount: 0,
    releaseDate: new Date('2023-08-03'),
    developer: "Larian Studios",
    publisher: "Larian Studios",
    genres: ["RPG", "Strategy"],
    tags: ["Story Rich", "Choices Matter", "Turn-Based Combat"],
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10 64-bit", processor: "Intel i5-4690 / AMD FX 8350", memory: "8 GB RAM", graphics: "GTX 970 / RX 480", storage: "150 GB" },
      recommended: { os: "Windows 10 64-bit", processor: "Intel i7-8700K / AMD r5 3600", memory: "16 GB RAM", graphics: "RTX 2060 Super / RX 5700 XT", storage: "150 GB" }
    },
    rating: 4.9,
    isFeatured: true
  },
  {
    title: "Terraria",
    shortDescription: "Dig, fight, explore, build! Nothing is impossible in this action-packed adventure game.",
    description: "The very world is at your fingertips as you fight for survival, fortune, and glory. Delve deep into cavernous expanses, seek out ever-greater foes, or construct your own city.",
    price: 369,
    discount: 50,
    releaseDate: new Date('2011-05-16'),
    developer: "Re-Logic",
    publisher: "Re-Logic",
    genres: ["Action", "Adventure", "RPG", "Indie"],
    tags: ["Survival", "Sandbox", "Crafting"],
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7, 8/8.1, 10", processor: "2.0 GHz", memory: "2.5GB", graphics: "128mb Video Memory", storage: "200MB" },
      recommended: { os: "Windows 7, 8/8.1, 10", processor: "Dual Core 3.0 Ghz", memory: "4GB", graphics: "256mb Video Memory", storage: "200MB" }
    },
    rating: 4.8,
    isFeatured: true
  },
  {
    title: "Titanfall 2",
    shortDescription: "Call down your Titan and get ready for an exhilarating first-person shooter experience.",
    description: "Experience a captivating single-player campaign exploring the bond between Pilot and Titan, or blast your way through a frantic and innovative multiplayer experience.",
    price: 1499,
    discount: 80,
    releaseDate: new Date('2016-10-28'),
    developer: "Respawn Entertainment",
    publisher: "Electronic Arts",
    genres: ["Action", "Shooter"],
    tags: ["FPS", "Multiplayer", "Mechs"],
    coverImage: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Win 7/8/8.1/10 64bit", processor: "Intel Core i3-3600t", memory: "8 GB RAM", graphics: "NVIDIA Geforce GTX 660", storage: "45 GB" },
      recommended: { os: "Win 7/8/8.1/10 64bit", processor: "Intel Core i5-6600", memory: "16 GB RAM", graphics: "NVIDIA Geforce GTX 1060 6GB", storage: "45 GB" }
    },
    rating: 4.7,
    isFeatured: true
  },
  {
    title: "PUBG: Battlegrounds",
    shortDescription: "Land, loot, survive! Play PUBG: BATTLEGROUNDS for free.",
    description: "Drop into original battlegrounds, loot weapons and supplies, and survive to be the last team standing in diverse and immersive maps.",
    price: 0,
    discount: 0,
    releaseDate: new Date('2017-12-21'),
    developer: "KRAFTON, Inc.",
    publisher: "KRAFTON, Inc.",
    genres: ["Action", "Shooter", "Multiplayer"],
    tags: ["Battle Royale", "Survival", "FPS"],
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "64-bit Windows 10", processor: "Intel Core i5-4430 / AMD FX-6300", memory: "8 GB RAM", graphics: "NVIDIA GeForce GTX 960", storage: "40 GB" },
      recommended: { os: "64-bit Windows 10", processor: "Intel Core i5-6600K / AMD Ryzen 5 1600", memory: "16 GB RAM", graphics: "NVIDIA GeForce GTX 1060", storage: "50 GB" }
    },
    rating: 4.2,
    isFeatured: false
  },
  {
    title: "Civilization VI",
    shortDescription: "Build an empire to stand the test of time.",
    description: "Civilization VI offers new ways to interact with your world, expand your empire across the map, advance your culture, and compete against history's greatest leaders.",
    price: 2499,
    discount: 90,
    releaseDate: new Date('2016-10-21'),
    developer: "Firaxis Games",
    publisher: "2K",
    genres: ["Strategy"],
    tags: ["Turn-Based", "Historical", "4X"],
    coverImage: "https://images.unsplash.com/photo-1580234811432-5202e6a92b23?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1580234811432-5202e6a92b23?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7x64 / Windows 8.1x64 / Windows 10x64", processor: "Intel Core i3 2.5 Ghz", memory: "4 GB RAM", graphics: "1 GB & AMD 5570 or nVidia 450", storage: "12 GB" },
      recommended: { os: "Windows 7x64 / Windows 8.1x64 / Windows 10x64", processor: "Fourth Generation Intel Core i5 2.5 Ghz", memory: "8 GB RAM", graphics: "2GB & AMD 7970 or nVidia 770", storage: "12 GB" }
    },
    rating: 4.5,
    isFeatured: false
  },
  {
    title: "Palworld",
    shortDescription: "Fight, farm, build and work alongside mysterious creatures called 'Pals' in this completely new multiplayer, open world survival and crafting game!",
    description: "Gather mysterious creatures called Pals across a vast open world and make them fight, build, farm, and work in factories.",
    price: 1300,
    discount: 10,
    releaseDate: new Date('2024-01-19'),
    developer: "Pocketpair",
    publisher: "Pocketpair",
    genres: ["Action", "Adventure", "RPG", "Survival"],
    tags: ["Open World", "Multiplayer", "Creature Collector"],
    coverImage: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10 or later (64-Bit)", processor: "i5-3570K 3.4 GHz 4 Core", memory: "16 GB RAM", graphics: "GeForce GTX 1050 (2GB)", storage: "40 GB" },
      recommended: { os: "Windows 10 or later (64-Bit)", processor: "i9-9900K 3.6 GHz 8 Core", memory: "32 GB RAM", graphics: "GeForce RTX 2070", storage: "40 GB" }
    },
    rating: 4.6,
    isFeatured: true
  },
  {
    title: "Project Zomboid",
    shortDescription: "Project Zomboid is the ultimate in zombie survival. Alone or in MP: you loot, build, craft, fight, farm and fish in a struggle to survive.",
    description: "An open-ended zombie-infested sandbox. It asks one simple question – how will you die?",
    price: 699,
    discount: 0,
    releaseDate: new Date('2013-11-08'),
    developer: "The Indie Stone",
    publisher: "The Indie Stone",
    genres: ["RPG", "Simulation", "Survival"],
    tags: ["Zombies", "Survival", "Multiplayer"],
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10, 64 Bit", processor: "Intel 2.77GHz Quad-core", memory: "8Gb Ram", graphics: "Dedicated graphics card with 2 GB of RAM minimum", storage: "5 GB" },
      recommended: { os: "Windows 10, 64 Bit", processor: "Intel 2.77GHz Quad-core", memory: "8Gb Ram", graphics: "Dedicated graphics card with 2 GB of RAM minimum", storage: "5 GB" }
    },
    rating: 4.8,
    isFeatured: false
  },
  {
    title: "Metro Exodus",
    shortDescription: "Flee the shattered ruins of dead Moscow and embark on an epic, continent-spanning journey.",
    description: "Metro Exodus is an epic, story-driven first person shooter from 4A Games that blends deadly combat and stealth with exploration and survival horror.",
    price: 1499,
    discount: 80,
    releaseDate: new Date('2019-02-14'),
    developer: "4A Games",
    publisher: "Deep Silver",
    genres: ["Action", "Shooter"],
    tags: ["Post-apocalyptic", "Atmospheric", "FPS"],
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7/8/10", processor: "Intel Core i5-4440", memory: "8 GB RAM", graphics: "GeForce GTX 670", storage: "59 GB" },
      recommended: { os: "Windows 10", processor: "Intel Core i7-4770k", memory: "8 GB RAM", graphics: "GeForce GTX 1070", storage: "59 GB" }
    },
    rating: 4.7,
    isFeatured: false
  },
  {
    title: "Resident Evil 2",
    shortDescription: "A deadly virus engulfs the residents of Raccoon City in September of 1998, plunging the city into chaos.",
    description: "The genre-defining masterpiece Resident Evil 2 returns, completely rebuilt from the ground up for a deeper narrative experience.",
    price: 1999,
    discount: 75,
    releaseDate: new Date('2019-01-24'),
    developer: "CAPCOM Co., Ltd.",
    publisher: "CAPCOM Co., Ltd.",
    genres: ["Action", "Adventure"],
    tags: ["Horror", "Zombies", "Survival Horror"],
    coverImage: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "WINDOWS® 10 (64-BIT Required)", processor: "Intel® Core™ i5-4460", memory: "8 GB RAM", graphics: "NVIDIA® GeForce® GTX 760", storage: "26 GB" },
      recommended: { os: "WINDOWS® 10 (64-BIT Required)", processor: "Intel® Core™ i7-3770", memory: "8 GB RAM", graphics: "NVIDIA® GeForce® GTX 1060", storage: "26 GB" }
    },
    rating: 4.9,
    isFeatured: false
  },
  {
    title: "Persona 5 Royal",
    shortDescription: "Don the mask and join the Phantom Thieves of Hearts as they stage grand heists, infiltrate the minds of the corrupt, and make them change their ways!",
    description: "Prepare for the award-winning RPG experience in this definitive edition of Persona 5 Royal, featuring a treasure trove of downloadable content included!",
    price: 4399,
    discount: 50,
    releaseDate: new Date('2022-10-21'),
    developer: "ATLUS",
    publisher: "SEGA",
    genres: ["RPG"],
    tags: ["JRPG", "Anime", "Story Rich"],
    coverImage: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10", processor: "Intel Core i7-4790", memory: "8 GB RAM", graphics: "Nvidia GeForce GTX 650 Ti", storage: "41 GB" },
      recommended: { os: "Windows 10", processor: "Intel Core i7-4790", memory: "8 GB RAM", graphics: "Nvidia GeForce GTX 760", storage: "41 GB" }
    },
    rating: 4.9,
    isFeatured: false
  },
  {
    title: "Metaphor: ReFantazio",
    shortDescription: "From the creative minds behind Persona 3, 4, and 5 comes Metaphor: ReFantazio, a unique fantasy world, where your protagonist will journey alongside his fairy companion, Gallica.",
    description: "Forge your own destiny and overcome fear as you step into a fantasy world unlike any other.",
    price: 4999,
    discount: 0,
    releaseDate: new Date('2024-10-11'),
    developer: "Studio Zero, ATLUS",
    publisher: "SEGA",
    genres: ["RPG"],
    tags: ["JRPG", "Fantasy", "Turn-Based Combat"],
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10", processor: "Intel Core i5-3470", memory: "6 GB RAM", graphics: "NVIDIA GeForce GTX 750 Ti", storage: "93 GB" },
      recommended: { os: "Windows 10", processor: "Intel Core i5-7600", memory: "8 GB RAM", graphics: "NVIDIA GeForce GTX 970", storage: "93 GB" }
    },
    rating: 4.8,
    isFeatured: true
  },
  {
    title: "Age of Empires II: Definitive Edition",
    shortDescription: "Age of Empires II: Definitive Edition celebrates the 20th anniversary of one of the most popular strategy games ever.",
    description: "Explore all the original campaigns like never before as well as the best-selling expansions, spanning over 200 hours of gameplay and 1,000 years of human history.",
    price: 529,
    discount: 50,
    releaseDate: new Date('2019-11-14'),
    developer: "Forgotten Empires",
    publisher: "Xbox Game Studios",
    genres: ["Strategy"],
    tags: ["RTS", "Historical", "Multiplayer"],
    coverImage: "https://images.unsplash.com/photo-1580234811432-5202e6a92b23?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1580234811432-5202e6a92b23?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 10 64bit", processor: "Intel Core 2 Duo", memory: "4 GB RAM", graphics: "Intel HD 4000", storage: "30 GB" },
      recommended: { os: "Windows 10 64bit", processor: "2.4 GHz i5", memory: "8 GB RAM", graphics: "Nvidia GTX 650", storage: "30 GB" }
    },
    rating: 4.8,
    isFeatured: false
  },
  {
    title: "RimWorld",
    shortDescription: "A sci-fi colony sim driven by an intelligent AI storyteller. Generates stories by simulating psychology, ecology, gunplay, melee combat, climate, biomes, diplomacy, interpersonal relationships, art, medicine, trade, and more.",
    description: "You begin with three survivors of a shipwreck on a distant world. Manage colonists' moods, needs, wounds, illnesses and addictions.",
    price: 1049,
    discount: 20,
    releaseDate: new Date('2018-10-17'),
    developer: "Ludeon Studios",
    publisher: "Ludeon Studios",
    genres: ["Indie", "Simulation", "Strategy"],
    tags: ["Base Building", "Management", "Sandbox"],
    coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7", processor: "Core 2 Duo", memory: "4 GB RAM", graphics: "Intel HD Graphics 4000", storage: "1 GB" },
      recommended: { os: "Windows 10", processor: "Core i5", memory: "8 GB RAM", graphics: "GTX 1050", storage: "1 GB" }
    },
    rating: 4.9,
    isFeatured: false
  },
  {
    title: "Balatro",
    shortDescription: "The poker roguelike. Balatro is a hypnotically satisfying deckbuilder where you play illegal poker hands.",
    description: "Combine valid poker hands with unique Joker cards in order to create varied synergies and builds. Earn enough chips to beat devious blinds.",
    price: 650,
    discount: 0,
    releaseDate: new Date('2024-02-20'),
    developer: "LocalThunk",
    publisher: "Playstack",
    genres: ["Indie", "Strategy"],
    tags: ["Card Game", "Roguelike", "Deckbuilding"],
    coverImage: "https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1605901309584-818e25960b8f?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7, 8, 10, 11 x64", processor: "Intel Core i3", memory: "1 GB RAM", graphics: "OpenGL 2.1 compatible graphics card", storage: "50 MB" },
      recommended: { os: "Windows 10 x64", processor: "Intel Core i5", memory: "2 GB RAM", graphics: "OpenGL 2.1 compatible graphics card", storage: "50 MB" }
    },
    rating: 4.9,
    isFeatured: false
  },
  {
    title: "Valheim",
    shortDescription: "A brutal exploration and survival game for 1-10 players, set in a procedurally-generated purgatory inspired by viking culture.",
    description: "Battle, build, and conquer your way to a saga worthy of Odin’s patronage!",
    price: 650,
    discount: 50,
    releaseDate: new Date('2021-02-02'),
    developer: "Iron Gate AB",
    publisher: "Coffee Stain Publishing",
    genres: ["Action", "Adventure", "Indie", "RPG"],
    tags: ["Survival", "Open World", "Viking"],
    coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
    images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1920"],
    systemRequirements: {
      minimum: { os: "Windows 7 or later", processor: "2.6 GHz Quad Core or similar", memory: "8 GB RAM", graphics: "GeForce GTX 950 or Radeon HD 7970", storage: "1 GB" },
      recommended: { os: "Windows 10 or later", processor: "i5 3GHz or Ryzen 5 3GHz", memory: "16 GB RAM", graphics: "GeForce GTX 1060 or Radeon RX 580", storage: "1 GB" }
    },
    rating: 4.7,
    isFeatured: false
  }
];

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('MongoDB Connected.');
    try {
      // Clear cache if you use Redis (optional but good practice)
      // Here we just insert into MongoDB
      await Game.insertMany(newGames);
      console.log(`Successfully added ${newGames.length} new games.`);
      process.exit(0);
    } catch (err) {
      console.error('Error inserting games:', err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
