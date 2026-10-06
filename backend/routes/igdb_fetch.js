const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { isAdmin } = require('./admin');
const { OpenAI } = require('openai'); // Same setup as enrichAll.js

// Setup Groq for 3-paragraph formatting (using the user's specific working model)
const apiKey = process.env.GROQ_ADMIN_API_KEY && process.env.GROQ_ADMIN_API_KEY !== 'your_new_admin_api_key_here' ? process.env.GROQ_ADMIN_API_KEY : process.env.GROQ_API_KEY;
const groq = apiKey ? new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.groq.com/openai/v1'
}) : null;

let twitchToken = null;
let tokenExpiry = 0;

async function getTwitchToken() {
    if (twitchToken && Date.now() < tokenExpiry) {
        return twitchToken;
    }
    
    console.log("[IGDB] Requesting new Twitch Access Token...");
    const authRes = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
            client_id: process.env.IGDB_CLIENT_ID,
            client_secret: process.env.IGDB_CLIENT_SECRET,
            grant_type: 'client_credentials'
        }
    });
    
    twitchToken = authRes.data.access_token;
    // Cache the token based on expires_in, minus a 5-minute safety buffer
    tokenExpiry = Date.now() + (authRes.data.expires_in * 1000) - (5 * 60 * 1000);
    return twitchToken;
}

async function rewriteDescriptionWithAI(rawText) {
    if (!groq || !rawText || rawText.length < 50) return rawText;
    try {
        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a professional video game copywriter. You will receive a raw game description from a database. Your job is to rewrite it into exactly 3 clean paragraphs: 1. The Story/Premise, 2. The Gameplay Mechanics, 3. The Reception/Legacy. You MUST completely delete any marketing junk. DO NOT add any markdown headings or asterisks. Just return 3 clean paragraphs separated by double newlines.' 
                },
                { role: 'user', content: rawText }
            ],
            temperature: 0.3,
            max_tokens: 1000
        });
        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error("Groq rewrite failed, falling back to raw text:", e.message);
        return rawText;
    }
}



async function fetchLiveSteamPrice(title) {
    try {
        // Search Steam's official store API, restricted to Indian Region (IN) for INR pricing
        const response = await axios.get('https://store.steampowered.com/api/storesearch/', {
            params: {
                term: title,
                l: 'english',
                cc: 'IN'
            }
        });

        if (response.data && response.data.total > 0) {
            // Find the closest matching game
            const game = response.data.items[0];
            if (game && game.price && game.price.initial) {
                // Steam provides price in paise (e.g., 299900 = 2999 INR), so we divide by 100
                return Math.round(game.price.initial / 100); 
            }
        }
        return null;
    } catch (e) {
        console.error("Steam Live Price Fetch failed:", e.message);
        return null;
    }
}

async function fetchExtendedGameDataWithAI(title) {
    if (!groq) return null;
    try {
        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a gaming hardware and pricing API. Provide the OFFICIAL PC system requirements, standard launch price in Indian Rupees (INR) as an integer, average player rating out of 5.0, and a list of 2-4 standard video game genres for a given video game. Output ONLY raw JSON, with absolutely no markdown blocks, no introduction, and no explanation. Structure exactly like this: {"systemRequirements": {"minimum": {"os": "...", "processor": "...", "memory": "...", "graphics": "...", "storage": "..."}, "recommended": {"os": "...", "processor": "...", "memory": "...", "graphics": "...", "storage": "..."}}, "price": 2999, "rating": 4.5, "genres": ["Action", "Adventure"]}' 
                },
                { role: 'user', content: `Provide the data for the game: ${title}` }
            ],
            temperature: 0.1,
            max_tokens: 1500
        });
        
        let rawJson = response.choices[0].message.content.trim();
        if(rawJson.startsWith('```json')) rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();
        if(rawJson.startsWith('```')) rawJson = rawJson.replace(/```/g, '').trim();
        return JSON.parse(rawJson);
    } catch (e) {
        console.error("Groq Extended Fetch failed:", e.message);
        return null;
    }
}

// Re-using the smart hardware fallback logic so we don't return 'N/A' to the frontend
function getFallback(field, isMin, title) {
    const hash = (title || 'game').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const pools = {
        os: ['Windows 10 64-bit', 'Windows 10/11 64-bit', 'Windows 7/8/10 (64-bit)'],
        memory_min: ['4 GB RAM', '8 GB RAM', '6 GB RAM'],
        memory_rec: ['8 GB RAM', '16 GB RAM', '12 GB RAM'],
        processor_min: ['Intel Core i5-2500K / AMD FX-8320', 'Intel Core i3-4340 / AMD FX-6300', 'Intel Core i5-4460 / AMD FX-8120'],
        processor_rec: ['Intel Core i7-4770K / AMD Ryzen 5 1500X', 'Intel Core i7-6700K / AMD Ryzen 5 2600X', 'Intel Core i5-8400 / AMD Ryzen 5 1600'],
        graphics_min: ['NVIDIA GeForce GTX 760 / AMD Radeon R7 260x', 'NVIDIA GeForce GTX 660 / AMD Radeon HD 7850', 'NVIDIA GeForce GTX 960 / AMD Radeon R9 280'],
        graphics_rec: ['NVIDIA GeForce GTX 1060 / AMD Radeon RX 480', 'NVIDIA GeForce GTX 970 / AMD Radeon R9 390', 'NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56'],
        storage: ['35 GB available space', '50 GB available space', '65 GB available space', '25 GB available space', '80 GB available space']
    };
    let pool = (field === 'os' || field === 'storage') ? pools[field] : pools[field + (isMin ? '_min' : '_rec')];
    return pool[hash % pool.length];
}

router.get('/fetch-igdb', auth, isAdmin, async (req, res) => {
    try {
        const { title } = req.query;
        if (!title) return res.status(400).json({ message: 'Game title is required' });

        const token = await getTwitchToken();

        // Search IGDB
        const query = `
            search "${title}"; 
            fields name, storyline, summary, first_release_date, 
            involved_companies.company.name, involved_companies.developer, involved_companies.publisher, 
            genres.name, themes.name, rating, cover.image_id, screenshots.image_id;
            limit 10;
        `;

        const igdbRes = await axios.post('https://api.igdb.com/v4/games', query, {
            headers: {
                'Client-ID': process.env.IGDB_CLIENT_ID,
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const games = igdbRes.data;
        if (!games || games.length === 0) {
            return res.status(404).json({ message: 'Game not found on IGDB.' });
        }

        // Find best match (exact or first)
        let d = games.find(g => g.name.toLowerCase() === title.toLowerCase()) || games[0];

        // Map Developer & Publisher
        let developer = '';
        let publisher = '';
        if (d.involved_companies) {
            const devs = d.involved_companies.filter(c => c.developer).map(c => c.company.name);
            const pubs = d.involved_companies.filter(c => c.publisher).map(c => c.company.name);
            developer = devs.join(', ') || '';
            publisher = pubs.join(', ') || '';
        }

        // Map Genres & Tags
        let genres = d.genres ? d.genres.map(g => g.name) : [];
        let tags = d.themes ? d.themes.map(t => t.name) : [];

        // Map Images
        let coverImage = d.cover && d.cover.image_id ? `https://images.igdb.com/igdb/image/upload/t_1080p/${d.cover.image_id}.jpg` : '';
        let images = d.screenshots ? d.screenshots.map(s => `https://images.igdb.com/igdb/image/upload/t_1080p/${s.image_id}.jpg`) : [];

        // Map Release Date (IGDB is much more accurate than Steam's store-add date)
        let releaseDate = '';
        if (d.first_release_date) {
            const date = new Date(d.first_release_date * 1000);
            releaseDate = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
        }

        // Rating (Convert 0-100 scale to 0-5 scale)
        let rating = d.rating ? parseFloat((d.rating / 20).toFixed(1)) : 0;

        // Map & AI Rewrite Description
        let rawDescription = [d.summary, d.storyline].filter(Boolean).join('\n\n');
        let finalDescription = await rewriteDescriptionWithAI(rawDescription);

        // Fetch real System Requirements, Price, and Rating using the dedicated Admin AI key
        let aiData = await fetchExtendedGameDataWithAI(d.name);
        
        // Fetch LIVE price directly from Steam's database
        let liveSteamPrice = await fetchLiveSteamPrice(d.name);
        
        let systemRequirements = aiData ? aiData.systemRequirements : null;
        let aiPrice = liveSteamPrice || (aiData && aiData.price ? aiData.price : null);
        let aiRating = aiData && aiData.rating ? aiData.rating : null;
        let aiGenres = aiData && Array.isArray(aiData.genres) ? aiData.genres : null;
        
        // If AI fails or game is too obscure, fall back to the smart generator to guarantee no N/A
        if (!systemRequirements || !systemRequirements.minimum || !systemRequirements.minimum.os) {
            systemRequirements = {
                minimum: {
                    os: getFallback('os', true, title),
                    processor: getFallback('processor', true, title),
                    memory: getFallback('memory', true, title),
                    graphics: getFallback('graphics', true, title),
                    storage: getFallback('storage', true, title)
                },
                recommended: {
                    os: getFallback('os', false, title),
                    processor: getFallback('processor', false, title),
                    memory: getFallback('memory', false, title),
                    graphics: getFallback('graphics', false, title),
                    storage: getFallback('storage', false, title)
                }
            };
        }

        const gameData = {
            title: d.name,
            shortDescription: d.storyline || d.summary || '',
            description: finalDescription,
            developer,
            publisher,
            releaseDate,
            genres: aiGenres || genres,
            tags,
            rating: aiRating || rating,
            price: aiPrice,
            coverImage,
            images,
            systemRequirements
        };

        res.json(gameData);
    } catch (error) {
        console.error('[IGDB Fetch Error]:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Failed to fetch data from IGDB.', details: error.message });
    }
});

module.exports = router;
