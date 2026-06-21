const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const connectDB = require("./config/database");
connectDB();

// Initialize Redis (runs in background, app works without it)
const redis = require('./config/redis');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/games', require('./routes/games'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payment', require('./routes/payment')); // Razorpay


// Health check — shows status of all services
app.get('/api/health', async (req, res) => {
  const redisStatus = redis.status === 'ready' ? 'connected' : 'disconnected';
  res.json({ 
    status: 'OK', 
    message: 'Ecliptix API is running',
    services: {
      mongodb: 'connected',
      redis: redisStatus
    }
  });
});

// Seed route (for development - add sample games)
app.get('/seed/games', async (req, res) => {
  try {
    const Game = require('./models/Game');


    const sampleGames = [
      {
        title: "Cyberpunk 2077",
        description: "An open-world, action-adventure RPG set in the megalopolis of Night City. Play as V, a mercenary outlaw going after a one-of-a-kind implant that is the key to immortality.",
        shortDescription: "Open-world action-adventure RPG in Night City",
        price: 4999,
        originalPrice: 4999,
        discount: 0,
        coverImage: "images/cyber-coverimg.jpg",
        images: ["images/cyber-img.jpg"],
        genres: ["Action", "RPG", "Sci-Fi"],
        tags: ["Open World", "Cyberpunk", "Story Rich"],
        developer: "CD Projekt RED",
        publisher: "CD Projekt",
        releaseDate: new Date("2020-12-10"),
        rating: 4.2,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-3570K",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 780",
            storage: "70 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i7-4790",
            memory: "16 GB RAM",
            graphics: "NVIDIA GTX 1060",
            storage: "70 GB SSD"
          },
          ideal: {
            os: "Windows 10/11",
            processor: "Intel Core i7-8700K / AMD Ryzen 7 3700X",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2070 / RTX 3060 or better (DLSS supported)",
            storage: "70 GB NVMe SSD"
          }
        }

      },
      {
        title: "The Witcher 3: Wild Hunt",
        description: "As war rages on throughout the Northern Realms, you take on the greatest contract of your life — tracking down the Child of Prophecy, a living weapon that can alter the shape of the world.",
        shortDescription: "Award-winning RPG adventure",
        price: 3319,
        originalPrice: 3319,
        discount: 50,
        coverImage: "images/withcher-cimg.png",
        images: ["images/witcher-img.png"],
        genres: ["RPG", "Fantasy", "Adventure"],
        tags: ["Open World", "Story Rich", "Medieval"],
        developer: "CD Projekt RED",
        publisher: "CD Projekt",
        releaseDate: new Date("2015-05-19"),
        rating: 4.8,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "64-bit Windows 7 / 8 / 10",
            processor: "Intel Core i5-2500K 3.3 GHz / AMD Phenom II X4 940",
            memory: "6 GB RAM",
            graphics: "NVIDIA GeForce GTX 660 or AMD Radeon HD 7870 (2 GB VRAM)",
            storage: "≈ 35–50 GB free space"
          },
          recommended: {
            os: "64-bit Windows 7 / 8 / 10",
            processor: "Intel Core i7 3770 3.4 GHz / AMD FX-8350 4 GHz",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 770 or AMD Radeon R9 290 (2+ GB VRAM)",
            storage: "≈ 35–50 GB free space"
          },
          ideal: {
            os: "64-bit Windows 10/11",
            processor: "Intel Core i5-7400 / AMD Ryzen 5 1600 or better",
            memory: "8+ GB RAM",
            graphics: "NVIDIA GeForce GTX 1070 / Radeon RX 480 or better (for high / max settings)",
            storage: "≈ 50 GB free space (SSD recommended)"
          }
        }

      },
      {
        title: "Elden Ring",
        description: "Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring and become an Elden Lord in the Lands Between.",
        shortDescription: "Action RPG with open world exploration",
        price: 2499,
        originalPrice: 2499,
        discount: 0,
        coverImage: "images/elc.jpg",
        images: ["images/elr.png"],
        genres: ["Action", "RPG", "Fantasy"],
        tags: ["Open World", "Souls-like", "Challenging"],
        developer: "FromSoftware",
        publisher: "Bandai Namco",
        releaseDate: new Date("2022-02-25"),
        rating: 4.9,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-8400 / AMD Ryzen 3 3300X",
            memory: "12 GB RAM",
            graphics: "NVIDIA GeForce GTX 1060 3GB / AMD Radeon RX 580 4GB",
            storage: "60 GB"
          },
          recommended: {
            os: "Windows 11",
            processor: "Intel Core i7-8700K / AMD Ryzen 5 3600X",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56",
            storage: "60 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2070 / RTX 3060 or better",
            storage: "60 GB NVMe SSD"
          }
        }

      },
      {
        title: "Grand Theft Auto V",
        description: "Grand Theft Auto V for PC offers players the option to explore the award-winning world of Los Santos and Blaine County in resolutions of up to 4K and beyond.",
        shortDescription: "Open-world action-adventure game",
        price: 2489,
        originalPrice: 2489,
        discount: 25,
        coverImage: "images/gta-cimg.jpg",
        images: ["images/gta-img.jpg"],
        genres: ["Action", "Adventure", "Open World"],
        tags: ["Open World", "Crime", "Multiplayer"],
        developer: "Rockstar North",
        publisher: "Rockstar Games",
        releaseDate: new Date("2013-09-17"),
        rating: 4.7,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 8.1",
            processor: "Intel Core 2 Quad Q6600 / AMD Phenom 9850",
            memory: "4 GB RAM",
            graphics: "NVIDIA GeForce 9800 GT / AMD Radeon HD 4870",
            storage: "72 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i5-3470 / AMD FX-8350",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 660 / AMD Radeon HD 7870",
            storage: "72 GB SSD"
          },
          ideal: {
            os: "Windows 10/11",
            processor: "Intel Core i7-7700K / AMD Ryzen 5 3600",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / GTX 1660 Super or better",
            storage: "72 GB NVMe SSD"
          }
        }

      },
      {
        title: "Red Dead Redemption 2",
        description: "America, 1899. The end of the wild west era has begun. After a robbery goes badly wrong in the western town of Blackwater, Arthur Morgan and the Van der Linde gang are forced to flee.",
        shortDescription: "Epic tale of life in America's unforgiving heartland",
        price: 3299,
        originalPrice: 3299,
        discount: 0,
        coverImage: "images/rdr-cimg.png",
        images: ["images/rdr-img.png"],
        genres: ["Action", "Adventure", "Western"],
        tags: ["Open World", "Story Rich", "Western"],
        developer: "Rockstar Games",
        publisher: "Rockstar Games",
        releaseDate: new Date("2019-11-05"),
        rating: 4.8,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Intel Core i5-2500K / AMD FX-6300",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 770 / AMD Radeon R9 280",
            storage: "150 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i7-4770K / AMD Ryzen 5 1500X",
            memory: "12 GB RAM",
            graphics: "NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 480 4GB",
            storage: "150 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2070 / RTX 3060 or better",
            storage: "150 GB NVMe SSD"
          }
        }

      },
      {
        title: "Minecraft",
        description: "Create, explore and survive alone or with friends on mobile devices or Windows 10. Expand your game: play in the ever-evolving Minecraft universe with Marketplace.",
        shortDescription: "Build, explore, and survive in infinite worlds",
        price: 2249,
        originalPrice: 2249,
        discount: 0,
        coverImage: "images/mc-cimg.png",
        images: ["images/mc-img.jpg"],
        genres: ["Sandbox", "Survival", "Building"],
        tags: ["Creative", "Multiplayer", "Pixel Graphics"],
        developer: "Mojang Studios",
        publisher: "Microsoft",
        releaseDate: new Date("2011-11-18"),
        rating: 4.6,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Intel Core i3-3210 / AMD A8-7600",
            memory: "4 GB RAM",
            graphics: "Intel HD Graphics 4000",
            storage: "1 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i5-4690 / AMD Ryzen 5 1400",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce 700 Series / AMD Radeon R7 Series",
            storage: "4 GB SSD"
          },
          ideal: {
            os: "Windows 10/11",
            processor: "Intel Core i5-11400F / AMD Ryzen 5 3600 or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 or better (for shaders & RTX)",
            storage: "4–10 GB NVMe SSD (more if heavily modded)"
          }
        }

      },
      {
        title: "Counter-Strike 2",
        description: "Counter-Strike 2 is the largest technical leap forward in Counter-Strike's history, ensuring new features and updates for years to come.",
        shortDescription: "The world's premier competitive FPS",
        price: 0,
        originalPrice: 0,
        coverImage: "images/cc2.jpg",
        discount: 0,
        images: ["images/c2.jpg"],
        genres: ["Action", "FPS", "Multiplayer"],
        tags: ["Competitive", "Tactical", "Team-Based"],
        developer: "Valve",
        publisher: "Valve",
        releaseDate: new Date("2023-09-27"),
        rating: 4.8,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "4 CPU hardware threads (Intel Core i3-8100 / Ryzen 3 1200 equivalent)",
            memory: "8 GB RAM",
            graphics: "DirectX 11 compatible GPU (GTX 750 Ti or better)",
            storage: "85 GB"
          },
          recommended: {
            os: "Windows 11",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 2600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce GTX 1060 / AMD RX 580",
            storage: "85 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X (high FPS competitive play)",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 or better (240 Hz competitive monitors)",
            storage: "85 GB NVMe SSD"
          }
        }

      },
      {
        title: "Black Myth: Wukong",
        description: "Black Myth: Wukong is an action RPG rooted in Chinese mythology. You are destined to venture as the Destined One, to set out on a journey into the wonders and perils of the West, and to uncover the obscure truth beneath the veil of a glorious legend from the past.",
        shortDescription: "Action RPG rooted in Chinese mythology",
        price: 3499,
        originalPrice: 3499,
        discount: 0,
        coverImage: "images/bmwc.jpg",
        images: ["images/bmw.jpg"],
        genres: ["Action", "RPG", "Adventure"],
        tags: ["Souls-like", "Mythology", "Single Player"],
        developer: "Game Science",
        publisher: "Game Science",
        releaseDate: new Date("2024-08-20"),
        rating: 4.8,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 1600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce GTX 1060 6GB / AMD Radeon RX 580 8GB",
            storage: "130 GB"
          },
          recommended: {
            os: "Windows 11",
            processor: "Intel Core i7-9700K / AMD Ryzen 5 3600XT",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce RTX 2060 SUPER / AMD Radeon RX 5700 XT",
            storage: "130 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or better",
            storage: "130 GB NVMe SSD"
          }
        }

      },
      {
        title: "Call of Duty: Modern Warfare III",
        description: "The ultimate multiplayer experience with classic maps, new weapons, and the return of Zombies mode.",
        shortDescription: "Intense military FPS action",
        price: 5499,
        originalPrice: 5499,
        discount: 10,
        coverImage: "images/cod-c.jpg",
        images: ["images/codd.png"],
        genres: ["Action", "FPS", "Multiplayer"],
        tags: ["Military", "Competitive", "Zombies"],
        developer: "Sledgehammer Games",
        publisher: "Activision",
        releaseDate: new Date("2023-11-10"),
        rating: 4.5,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-6600K / AMD Ryzen 5 1400",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 960 / AMD Radeon RX 470",
            storage: "149 GB"
          },
          recommended: {
            os: "Windows 11",
            processor: "Intel Core i7-8700K / AMD Ryzen 5 3600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce RTX 3060 / AMD Radeon RX 6600 XT",
            storage: "149 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3080 / RTX 4070 or better (for high FPS & Ultra)",
            storage: "149 GB NVMe SSD"
          }
        }

      },
      {
        title: "God of War Ragnarök",
        description: "From Santa Monica Studio and brought to PC in partnership with Jetpack Interactive, this is an epic and heartfelt journey that follows Kratos and Atreus as they struggle with holding on and letting go. Kratos and Atreus must journey to each of the Nine Realms in search of answers as Odin's forces in Asgard prepare for a prophesied battle that will end the world.",
        shortDescription: "Kratos and Atreus journey to the Nine Realms as Ragnarök approaches",
        price: 4999, // Standard PC price
        originalPrice: 4999,
        discount: 0,
        coverImage: "images/gow-c.jpg",
        images: ["images/gow.jpeg"],
        genres: ["Action", "Adventure", "RPG"],
        tags: ["Single Player", "Story Rich", "Mythology"],
        developer: "Santa Monica Studio, Jetpack Interactive",
        publisher: "PlayStation Publishing LLC",
        releaseDate: new Date("2024-09-19"),
        rating: 4.9,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10 64-bit",
            processor: "Intel Core i5-4670K / AMD Ryzen 3 1200",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 1060 (6GB) / AMD RX 5500 XT (8GB)",
            storage: "190 GB SSD"
          },
          recommended: {
            os: "Windows 10 64-bit",
            processor: "Intel Core i5-8600 / AMD Ryzen 5 3600",
            memory: "16 GB RAM",
            graphics: "NVIDIA RTX 2060 Super / AMD RX 5700",
            storage: "190 GB SSD"
          },
          ideal: {
            os: "Windows 11 64-bit",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or better",
            storage: "190 GB NVMe SSD"
          }
        }

      },
      {
        title: "Hogwarts Legacy",
        description: "Experience Hogwarts in the 1800s. Your character is a student who holds the key to an ancient secret that threatens to tear the wizarding world apart.",
        shortDescription: "Open-world action RPG set in the Wizarding World",
        price: 3999,
        originalPrice: 3999,
        discount: 20,
        coverImage: "images/hog-c.jpeg",
        images: ["images/hog.png"],
        genres: ["Action", "RPG", "Adventure"],
        tags: ["Open World", "Magic", "Story Rich"],
        developer: "Avalanche Software",
        publisher: "Warner Bros. Games",
        releaseDate: new Date("2023-02-10"),
        rating: 4.7,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 2600",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 1070 / AMD RX Vega 56",
            storage: "85 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i7-8700 / AMD Ryzen 5 3600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce GTX 1080 Ti / AMD RX 6700 XT",
            storage: "85 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or better",
            storage: "85 GB NVMe SSD"
          }
        }

      },
      {
        title: "Resident Evil 4",
        description: "Survival is just the beginning. Six years have passed since the biological disaster in Raccoon City.",
        shortDescription: "Survival horror action game",
        price: 3499,
        originalPrice: 3499, //
        discount: 15,
        coverImage: "images/re4c.jpg",
        images: ["images/re4.png"],
        genres: ["Action", "Horror", "Survival"],
        tags: ["Survival Horror", "Third Person", "Story Rich"],
        developer: "CAPCOM Co., Ltd.",
        publisher: "CAPCOM Co., Ltd.",
        releaseDate: new Date("2023-03-24"),
        rating: 4.8,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "AMD Ryzen 3 1200 / Intel Core i5-7500",
            memory: "8 GB RAM",
            graphics: "AMD Radeon RX 560 / NVIDIA GTX 1050 Ti",
            storage: "50 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 3600 / Intel Core i7-8700",
            memory: "16 GB RAM",
            graphics: "AMD Radeon RX 6700 XT / NVIDIA RTX 2060",
            storage: "50 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "AMD Ryzen 7 5800X / Intel Core i7-12700K or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3060 / RTX 3070 / AMD Radeon RX 6800 or better",
            storage: "50 GB NVMe SSD"
          }
        }

      },
      {
        title: "Starfield",
        description: "Starfield is the first new universe in 25 years from Bethesda Game Studios, the award-winning creators of The Elder Scrolls V: Skyrim and Fallout 4.",
        shortDescription: "Epic space exploration RPG",
        price: 4999,
        originalPrice: 4999, //
        discount: 0,
        coverImage: "https://assets.xboxservices.com/assets/28/98/2898b802-4629-4b5d-b825-e5aee13aab8c.jpg?n=Starfield_GLP-Page-Hero-0_1083x1222_05.jpg",
        images: ["https://cdn.mos.cms.futurecdn.net/ijyHy7Lc9shyoJKNSYwN6E.jpg"],
        genres: ["RPG", "Sci-Fi", "Adventure"],
        tags: ["Open World", "Space", "Exploration"],
        developer: "Bethesda Game Studios",
        publisher: "Bethesda Softworks",
        releaseDate: new Date("2023-09-06"),
        rating: 4.3,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 2600X / Intel Core i7-6800K",
            memory: "16 GB RAM",
            graphics: "AMD Radeon RX 5700 / NVIDIA GTX 1070 Ti",
            storage: "125 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 3600X / Intel Core i5-10600K",
            memory: "16 GB RAM",
            graphics: "AMD Radeon RX 6800 XT / NVIDIA RTX 2080",
            storage: "125 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "AMD Ryzen 7 5800X / Intel Core i7-12700K or better",
            memory: "32 GB RAM (YES, 32GB helps a lot)",
            graphics: "NVIDIA RTX 3080 / RTX 4070 / AMD Radeon RX 7900 XT or better",
            storage: "125 GB NVMe SSD (extremely important)"
          }
        }

      },
      {
        title: "Forza Horizon 5",
        description: "Your Ultimate Horizon Adventure awaits! Explore the vibrant open world landscapes of Mexico with limitless, fun driving action in hundreds of the world's greatest cars.",
        shortDescription: "Open-world racing game",
        price: 3999,
        originalPrice: 3999,
        discount: 30,
        coverImage: "images/h5c.png",
        images: ["images/h55.jpg"],
        genres: ["Racing", "Simulation", "Open World"],
        tags: ["Racing", "Open World", "Multiplayer"],
        developer: "Playground Games",
        publisher: "Xbox Game Studios",
        releaseDate: new Date("2021-11-09"),
        rating: 4.8,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 10 ",
            processor: "Intel Core i5-4460 / AMD Ryzen 3 1200",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 970 / AMD Radeon RX 470",
            storage: "110 GB SSD"
          },
          recommended: {
            os: "Windows 10/11 ",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 1500X",
            memory: "16 GB RAM",
            graphics: "NVIDIA GeForce GTX 1070 / AMD Radeon RX 590",
            storage: "110 GB SSD"
          },
          ideal: {
            os: "Windows 11 ",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or AMD RX 6800 XT",
            storage: "110 GB NVMe SSD"
          }
        }

      },
      {
        title: "Marvel's Spider-Man Remastered",
        description: "The critically acclaimed Marvel's Spider-Man brings the popular Super Hero to life in an original story. Experience the complete award-winning adventure.",
        shortDescription: "Swing through New York as Spider-Man",
        price: 3999,
        originalPrice: 3999,
        discount: 25,
        coverImage: "https://image.api.playstation.com/vulcan/ap/rnd/202009/3021/B2aUYFC0qUAkNnjbTHRyhrg3.png",
        images: ["https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/header.jpg"],
        genres: ["Action", "Adventure", "Open World"],
        tags: ["Superhero", "Open World", "Story Rich"],
        developer: "Insomniac Games",
        publisher: "PlayStation PC LLC",
        releaseDate: new Date("2022-08-12"),
        rating: 4.9,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i3-4160 / AMD FX-6300",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 950 / AMD Radeon R9 290X",
            storage: "75 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i5-4670 / AMD Ryzen 5 1600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GTX 1060 / AMD RX 580",
            storage: "75 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or AMD RX 6800 XT (for RT & 1440p/4K)",
            storage: "75 GB NVMe SSD"
          }
        }

      },
      {
        title: "Assassin's Creed Valhalla",
        description: "Become Eivor, a legendary Viking raider on a quest for glory. Explore England's Dark Ages as you raid your enemies, grow your settlement, and build your political power.",
        shortDescription: "Viking action-adventure RPG",
        price: 2999,
        originalPrice: 2999,
        discount: 40,
        coverImage: "images/acc.png",
        images: ["images/ac.png"],
        genres: ["Action", "RPG", "Adventure"],
        tags: ["Open World", "Vikings", "Stealth"],
        developer: "Ubisoft Montreal",
        publisher: "Ubisoft",
        releaseDate: new Date("2020-11-10"),
        rating: 4.6,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "AMD Ryzen 3 1200 / Intel Core i5-4460",
            memory: "8 GB RAM",
            graphics: "AMD RX 570 / NVIDIA GTX 960",
            storage: "50 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 1600 / Intel Core i7-6700",
            memory: "8 GB RAM",
            graphics: "AMD RX 5700 XT / NVIDIA GTX 1070",
            storage: "50 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "AMD Ryzen 7 5800X / Intel Core i7-12700K or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or AMD RX 6800 XT (for 1440p/4K Ultra)",
            storage: "50 GB NVMe SSD"
          }
        }

      },
      {
        title: "FIFA 24",
        description: "EA SPORTS FC 24 is the new era for The World's Game: 19,000+ fully licensed players, 700+ teams, and 100+ stadiums.",
        shortDescription: "The world's most authentic football game",
        price: 3999,
        originalPrice: 3999,
        discount: 0,
        coverImage: "images/fifac.png",
        images: ["images/fifa.jpeg"],
        genres: ["Sports", "Simulation", "Multiplayer"],
        tags: ["Football", "Multiplayer", "Realistic"],
        developer: "EA Sports",
        publisher: "Electronic Arts",
        releaseDate: new Date("2023-09-29"),
        rating: 4.2,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-6600K / AMD Ryzen 5 1600",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 1050 Ti / AMD RX 570",
            storage: "100 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i7-6700 / AMD Ryzen 5 2600",
            memory: "12 GB RAM",
            graphics: "NVIDIA GTX 1660 / AMD RX 5800",
            storage: "100 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3060 / RTX 3070 / RTX 4070 or AMD RX 6800 for ultra + high-FPS gameplay",
            storage: "100 GB NVMe SSD"
          }
        }

      },
      {
        title: "The Last of Us Part I",
        description: "Experience the emotional storytelling and unforgettable characters in The Last of Us, winner of over 200 Game of the Year awards.",
        shortDescription: "Post-apocalyptic survival adventure",
        price: 3999,
        originalPrice: 3999,
        discount: 0,
        coverImage: "https://cdn.wallpapersafari.com/19/8/dA2Zpa.jpg",
        images: ["https://cdn.wallpapersafari.com/19/8/dA2Zpa.jpg"],
        genres: ["Action", "Adventure", "Survival"],
        tags: ["Story Rich", "Post-Apocalyptic", "Single Player"],
        developer: "Naughty Dog",
        publisher: "PlayStation PC LLC",
        releaseDate: new Date("2023-03-28"),
        rating: 4.9,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 1500X / Intel Core i7-4770",
            memory: "16 GB RAM",
            graphics: "AMD RX 580 / NVIDIA GTX 1060 6GB",
            storage: "100 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 3600X / Intel Core i5-9600K",
            memory: "16 GB RAM",
            graphics: "AMD RX 6600 XT / NVIDIA RTX 2060 Super",
            storage: "100 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "AMD Ryzen 7 5800X / Intel Core i7-12700K or better",
            memory: "32 GB RAM",
            graphics: "NVIDIA RTX 3070 / RTX 3080 / RTX 4070 or AMD RX 6800 XT (for 1440p/4K Ultra)",
            storage: "100 GB NVMe SSD"
          }
        }

      },
      {
        "title": "Diablo IV",
        "description": "Return to darkness. The next generation of action role-playing games. Choose your class and battle through Sanctuary.",
        "shortDescription": "Dark fantasy action RPG",
        "price": 4999,
        "originalPrice": 4999,
        "discount": 0,
        "coverImage": "https://store-images.s-microsoft.com/image/apps.27418.14058691289303304.7aeef6ea-ac74-41c2-a37d-5c5c1e0eb55d.e73f1084-51de-4266-8084-2f8787ae9c3f",
        "images": [
          "https://developer.microsoft.com/content/dam/microsoftgamedev/blogs/images/header/2024/10/diablo4_HERO2.png"
        ],
        "genres": [
          "Action",
          "RPG",
          "Hack and Slash"
        ],
        "tags": [
          "Dark Fantasy",
          "Loot",
          "Multiplayer"
        ],
        "developer": "Blizzard Entertainment",
        "publisher": "Blizzard Entertainment",
        "releaseDate": "2023-06-06",
        "rating": 4.4,
        "featured": true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel Core i5-2500K / AMD FX-8350",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 660 / AMD Radeon R9 280",
            storage: "90 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i7-8700K / AMD Ryzen 5 3600",
            memory: "16 GB RAM",
            graphics: "NVIDIA GTX 1060 / AMD RX 580",
            storage: "90 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 3060 / RTX 3070 / RTX 4070 or AMD RX 6800 XT (for 1440p/4K Ultra & smoother endgame)",
            storage: "90 GB NVMe SSD"
          }
        }

      },
      {
        title: "Apex Legends",
        description: "Apex Legends is the award-winning, free-to-play Hero Shooter from Respawn Entertainment. Master an ever-growing roster of legendary characters with powerful abilities.",
        shortDescription: "Free-to-play hero battle royale",
        price: 0,
        originalPrice: 0,
        discount: 0,
        coverImage: "https://cdn1.epicgames.com/spt-assets/5dcd88f4e2094a698ebffa43438edc33/apex-legends-1mf51.jpg",
        images: ["https://www.nintendo.com/eu/media/images/assets/nintendo_switch_games/apexlegends/2x1_ApexLegends_25.jpg"],
        genres: ["Action", "FPS", "Battle Royale"],
        tags: ["Free to Play", "Competitive", "Multiplayer"],
        developer: "Respawn Entertainment",
        publisher: "Electronic Arts",
        releaseDate: new Date("2020-11-04"),
        rating: 4.6,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "AMD FX-4350 / Intel Core i3-6300",
            memory: "6 GB RAM",
            graphics: "AMD Radeon HD 7730 / NVIDIA GTX 640",
            storage: "56 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "AMD Ryzen 5 / Intel Core i5-6600",
            memory: "8 GB RAM",
            graphics: "AMD Radeon R9 290 / NVIDIA GTX 970",
            storage: "56 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X (for high FPS competitive)",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 / RTX 4070 or AMD RX 6700 XT (for 144Hz–240Hz gameplay)",
            storage: "56 GB NVMe SSD"
          }
        }

      },
      {
        title: "Dota 2",
        description: "Every day, millions of players worldwide enter battle as one of over a hundred Dota Heroes. And no matter if it's their 10th hour of play or 1,000th, there's always something new to discover.",
        shortDescription: "Free-to-play MOBA",
        price: 0,
        originalPrice: 0,
        discount: 0,
        coverImage: "https://i.pinimg.com/236x/40/48/f1/4048f19feaadf8ade5bfee9466e236de.jpg",
        images: ["https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/570/capsule_616x353.jpg?t=1762820658"],
        genres: ["Action", "MOBA", "Strategy", "Multiplayer"],
        tags: ["Free to Play", "MOBA", "Competitive", "Team-Based"],
        developer: "Valve",
        publisher: "Valve",
        releaseDate: new Date("2013-07-09"),
        rating: 4.7,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Dual core Intel or AMD at 2.8 GHz",
            memory: "4 GB RAM",
            graphics: "NVIDIA GeForce 8600/9600GT or AMD Radeon HD2600/3600",
            storage: "60 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i5-4430 / AMD FX-8350",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 960 2GB / AMD Radeon R9 280",
            storage: "60 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X for high-FPS team fights",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 / RTX 4070 or AMD RX 6700 XT (for 144Hz–240Hz monitors)",
            storage: "60 GB NVMe SSD"
          }
        }

      },
      {
        title: "Tomb Raider",
        description: "Tomb Raider explores the intense origin story of Lara Croft and her ascent from a young woman to a hardened survivor.",
        shortDescription: "Action-adventure survival game",
        price: 999,
        originalPrice: 999,
        discount: 50,
        coverImage: "https://m.media-amazon.com/images/M/MV5BZWRhNDIwMDQtOTE1ZS00YTQ1LThlYmYtYzBhZjE4NTEwZTIyXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg",
        images: ["https://gamingbolt.com/wp-content/uploads/2022/04/Tomb-Raider-2013.jpg"],
        genres: ["Action", "Adventure", "Survival"],
        tags: ["Single Player", "Story Rich", "Exploration"],
        developer: "Crystal Dynamics",
        publisher: "Square Enix",
        releaseDate: new Date("2013-03-05"),
        rating: 4.7,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows XP",
            processor: "Dual core Intel or AMD",
            memory: "2 GB RAM",
            graphics: "DirectX 9 compatible GPU (NVIDIA GeForce 8600GT / AMD HD 2600)",
            storage: "10 GB"
          },
          recommended: {
            os: "Windows 7",
            processor: "Quad core Intel or AMD",
            memory: "4 GB RAM",
            graphics: "DirectX 11 GPU (NVIDIA GTX 480 / AMD Radeon HD 5870)",
            storage: "12 GB SSD"
          },
          ideal: {
            os: "Windows 10/11",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 2600 or better",
            memory: "8–16 GB RAM",
            graphics: "NVIDIA GTX 1060 / GTX 1650 Super / RTX 2060 or AMD RX 580+ (for ultra @ 1080p/1440p)",
            storage: "12 GB NVMe SSD"
          }
        }

      },
      {
        title: "Sekiro: Shadows Die Twice",
        description: "Game of the Year - The Golden Joystick Awards 2019. Action-adventure game set in 1500s Sengoku Japan.",
        shortDescription: "Action-adventure in feudal Japan",
        price: 2999,
        originalPrice: 2999,
        discount: 30,
        coverImage: "https://m.media-amazon.com/images/M/MV5BMzFiM2Y3NmMtNDY3MC00MThhLWFhNmYtZjIzMDNjZmNhMTdhXkEyXkFqcGc@._V1_.jpg",
        images: ["https://dpad.fm/wiki/images/8/88/Sekiro-shadows-die-twice.png"],
        genres: ["Action", "Adventure", "RPG"],
        tags: ["Souls-like", "Challenging", "Single Player"],
        developer: "FromSoftware",
        publisher: "Activision",
        releaseDate: new Date("2019-03-22"),
        rating: 4.8,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Intel Core i3-2100 / AMD FX-6300",
            memory: "4 GB RAM",
            graphics: "NVIDIA GeForce GTX 760 / AMD Radeon HD 7950",
            storage: "25 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i5-2500K / AMD Ryzen 5 1400",
            memory: "8 GB RAM",
            graphics: "NVIDIA GeForce GTX 970 / AMD Radeon RX 570",
            storage: "25 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i7-12700K / AMD Ryzen 7 5800X or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 / RTX 4070 or AMD RX 6700 XT (for ultra + 1440p/4K and 144Hz)",
            storage: "25 GB NVMe SSD"
          }
        }

      },
      {
        title: "Hades",
        description: "Defy the god of the dead as you hack and slash out of the Underworld in this rogue-like dungeon crawler.",
        shortDescription: "Roguelike dungeon crawler",
        price: 999,
        originalPrice: 999,
        discount: 0,
        coverImage: "https://images-cdn.ubuy.co.in/654d1bf04062536d0413ef35-cinemaflix-hades-video-game-poster.jpg",
        images: ["https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/header.jpg"],
        genres: ["Action", "Roguelike", "Indie"],
        tags: ["Roguelike", "Indie", "Story Rich"],
        developer: "Supergiant Games",
        publisher: "Supergiant Games",
        releaseDate: new Date("2020-09-17"),
        rating: 4.9,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Dual Core 2.4 GHz (Intel or AMD)",
            memory: "4 GB RAM",
            graphics: "1GB VRAM / DirectX 10+ GPU (GTX 650 or equivalent)",
            storage: "15 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Dual Core 3.0 GHz+",
            memory: "8 GB RAM",
            graphics: "2GB VRAM / DirectX 10+ GPU (GTX 750 Ti or equivalent)",
            storage: "20 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i5-8400 / AMD Ryzen 5 2600 or better",
            memory: "16 GB RAM",
            graphics: "NVIDIA GTX 1650 / RTX 2060 / AMD RX 580 or better (for high FPS & 144Hz+ monitors)",
            storage: "20 GB NVMe SSD"
          }
        }

      },
      {
        title: "Valorant",
        description: "VALORANT is a character-based 5v5 tactical FPS where precise gunplay meets unique agent abilities.",
        shortDescription: "Free-to-play tactical FPS",
        price: 0,
        originalPrice: 0,
        discount: 0,
        coverImage: "https://assets.xboxservices.com/assets/36/b5/36b52fa8-e71b-4435-888a-cecb98d3876a.jpg?n=153142244433_GLP-Page-Hero-0_1083x1222_02.jpg",
        images: ["https://i.ytimg.com/vi/mdYEBUROBec/maxresdefault.jpg"],
        genres: ["Action", "FPS", "Tactical"],
        tags: ["Free to Play", "Competitive", "Team-Based"],
        developer: "Riot Games",
        publisher: "Riot Games",
        releaseDate: new Date("2020-06-02"),
        rating: 4.7,
        featured: true,
        systemRequirements: {
          minimum: {
            os: "Windows 7",
            processor: "Intel Core 2 Duo E8400 / AMD Athlon 200GE",
            memory: "4 GB RAM",
            graphics: "Intel HD 4000",
            storage: "8 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel Core i3-4150 / AMD Ryzen 3 1200",
            memory: "4–8 GB RAM",
            graphics: "NVIDIA GeForce GT 730 / AMD Radeon R7 240",
            storage: "8 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel Core i5-12400F / AMD Ryzen 5 5600 or better (for high FPS competitive)",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 / RTX 4070 or AMD RX 6700 XT (for 144Hz–240Hz gameplay)",
            storage: "8 GB NVMe SSD"
          }
        }

      },
      {
        title: "Devour",
        description: "Devour is a co-op horror survival game for 1-4 players. Stop possessed cultists before they drag you to hell. Run. Scream. Hide. Just don't get caught.",
        shortDescription: "Co-op horror survival game",
        price: 999, // Set to be consistent with other indie prices
        originalPrice: 999,
        coverImage: "https://cdn1.epicgames.com/spt-assets/9e85997cf2ed435ebade8a0f6639af03/download-devour-offer-acjuy.jpg",
        images: ["https://cdn1.epicgames.com/spt-assets/9e85997cf2ed435ebade8a0f6639af03/devour-offer-9i025.jpg"],
        genres: ["Horror", "Co-op", "Indie"],
        tags: ["Horror", "Online Co-Op", "Multiplayer", "Survival Horror"],
        developer: "Straight Back Games",
        publisher: "Straight Back Games",
        releaseDate: new Date("2021-01-28"),
        rating: 4.8,
        featured: false,
        systemRequirements: {
          minimum: {
            os: "Windows 10",
            processor: "Intel i5 or new-gen i3 / AMD equivalent",
            memory: "8 GB RAM",
            graphics: "NVIDIA GTX 970 / AMD Radeon R9 290",
            storage: "8 GB"
          },
          recommended: {
            os: "Windows 10",
            processor: "Intel i7 / AMD equivalent",
            memory: "16 GB RAM",
            graphics: "NVIDIA GTX 1060 / AMD Radeon RX 580",
            storage: "8 GB SSD"
          },
          ideal: {
            os: "Windows 11",
            processor: "Intel i5-12400F / AMD Ryzen 5 5600 or better",
            memory: "16–32 GB RAM",
            graphics: "NVIDIA RTX 2060 / RTX 3060 / AMD RX 6700 XT (for ultra + 144Hz multiplayer)",
            storage: "8 GB NVMe SSD"
          }
        }

      },
    ];

    let createdCount = 0;
    let updatedCount = 0;

    // Loop through each game in your code list
    for (const gameData of sampleGames) {
      // "Upsert" means: Update if found, Insert if not found
      // We look for a game with the same 'title'
      const result = await Game.updateOne(
        { title: gameData.title }, // 1. Search condition
        { $set: gameData },        // 2. Data to update/insert
        { upsert: true }           // 3. Enable "Upsert" mode
      );

      if (result.upsertedCount > 0) createdCount++;
      else updatedCount++;
    }

    res.json({
      message: 'Database synced successfully!',
      added: createdCount,
      updated: updatedCount,
      note: "Games added via Admin Panel are safe."
    });

  } catch (error) {
    res.status(500).json({ message: error.message });

  }

});


app.get("/", (req, res) => {
  res.status(200).send("Ecliptix backend is running 🚀");
});


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});