const OpenAI = require('openai');
const groq = process.env.GROQ_API_KEY ? new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
}) : null;

async function rewriteDescriptionWithAI(rawText) {
    if (!groq || !rawText || rawText.length < 50) return rawText;
    try {
        const response = await groq.chat.completions.create({
            model: 'openai/gpt-oss-120b',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a professional video game copywriter. You will receive a raw, messy game description from a storefront. Your job is to rewrite it into exactly 3 clean paragraphs: 1. The Story/Premise, 2. The Gameplay Mechanics, 3. The Reception/Legacy. You MUST completely delete any marketing junk, DLC advertisements, or "IMPORTANT:" alerts. DO NOT add any markdown headings or asterisks. Just return 3 clean paragraphs separated by double newlines.' 
                },
                { role: 'user', content: rawText }
            ],
            temperature: 0.3,
            max_tokens: 500
        });
        return response.choices[0].message.content.trim();
    } catch (e) {
        console.error("Groq rewrite failed, falling back to raw text:", e.message);
        return rawText;
    }
}

const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { isAdmin } = require('./admin');

// Helper to strip HTML tags but preserve paragraphs
function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')      // Convert <br> to newline
        .replace(/<\/p>/gi, '\n\n')        // Convert </p> to double newline
        .replace(/<[^>]*>?/gm, ' ')         // Remove all other HTML tags
        .replace(/&amp;/g, '&')             // Fix ampersands
        .replace(/&quot;/g, '"')            // Fix quotes
        .replace(/ +/g, ' ')                // Collapse multiple spaces
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Prevent triple newlines
        .trim();
}


// Realistic Fallback Data Generators (Pseudo-random based on title length/characters to ensure consistency per game)
function getFallback(field, isMin, title) {
    const hash = (title || 'game').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    const pools = {
        os: [
            'Windows 10 64-bit',
            'Windows 10/11 64-bit',
            'Windows 7/8/10 (64-bit)'
        ],
        memory_min: ['4 GB RAM', '8 GB RAM', '6 GB RAM'],
        memory_rec: ['8 GB RAM', '16 GB RAM', '12 GB RAM'],
        processor_min: [
            'Intel Core i5-2500K / AMD FX-8320', 
            'Intel Core i3-4340 / AMD FX-6300', 
            'Intel Core i5-4460 / AMD FX-8120'
        ],
        processor_rec: [
            'Intel Core i7-4770K / AMD Ryzen 5 1500X', 
            'Intel Core i7-6700K / AMD Ryzen 5 2600X', 
            'Intel Core i5-8400 / AMD Ryzen 5 1600'
        ],
        graphics_min: [
            'NVIDIA GeForce GTX 760 / AMD Radeon R7 260x', 
            'NVIDIA GeForce GTX 660 / AMD Radeon HD 7850', 
            'NVIDIA GeForce GTX 960 / AMD Radeon R9 280'
        ],
        graphics_rec: [
            'NVIDIA GeForce GTX 1060 / AMD Radeon RX 480', 
            'NVIDIA GeForce GTX 970 / AMD Radeon R9 390', 
            'NVIDIA GeForce GTX 1070 / AMD Radeon RX Vega 56'
        ],
        storage: [
            '35 GB available space',
            '50 GB available space',
            '65 GB available space',
            '25 GB available space',
            '80 GB available space'
        ]
    };

    let pool = [];
    if (field === 'os' || field === 'storage') {
        pool = pools[field];
    } else {
        pool = pools[field + (isMin ? '_min' : '_rec')];
    }

    return pool[hash % pool.length];
}

// Extract specs from Steam's HTML requirements string
function parseRequirements(htmlStr, isMin, title) {
    const reqs = { 
        os: getFallback('os', isMin, title), 
        processor: getFallback('processor', isMin, title), 
        memory: getFallback('memory', isMin, title), 
        graphics: getFallback('graphics', isMin, title), 
        storage: getFallback('storage', isMin, title) 
    };
    
    if (!htmlStr) return reqs; // If completely empty, return the realistic fallbacks
    
    
    const extract = (key, fallbackKey) => {
        const regex = new RegExp(`>\\s*${key}[^<]*<\\/strong>[\\s\\S]*?([^<]+)`, 'i');
        const match = htmlStr.match(regex);
        let val = match ? match[1].trim() : null;
        
        if (!val && fallbackKey) {
            const regex2 = new RegExp(`>\\s*${fallbackKey}[^<]*<\\/strong>[\\s\\S]*?([^<]+)`, 'i');
            const match2 = htmlStr.match(regex2);
            val = match2 ? match2[1].trim() : null;
        }

        if (!val || val === 'N/A' || val.toLowerCase().includes('not specified') || val.length < 3) {
            return getFallback((fallbackKey ? 'graphics' : (key === 'Storage' ? 'storage' : key)).toLowerCase(), isMin, title);
        }
        return val;
    };

    reqs.os = extract('OS');
    reqs.processor = extract('Processor');
    reqs.memory = extract('Memory');
    reqs.graphics = extract('Graphics', 'Video Card');
    reqs.storage = extract('Storage', 'Hard Drive');
    
    return reqs;
}



router.get('/fetch-steam', auth, isAdmin, async (req, res) => {
    try {
        const title = req.query.title;
        if (!title) return res.status(400).json({ message: 'Title is required' });

        // 1. Search Steam Store directly
        console.log(`Searching Steam for: ${title}`);
        const searchRes = await axios.get(`https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(title)}&l=english&cc=US`);
        
        if (!searchRes.data || !searchRes.data.items || searchRes.data.items.length === 0) {
            return res.status(404).json({ message: 'Game not found on Steam. Try a different spelling.' });
        }

        // Get the best match (first result)
        const matchedApp = searchRes.data.items[0];

        // 2. Fetch App Details
        console.log(`Fetching details for Steam App ID: ${matchedApp.id}`);
        const detailRes = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${matchedApp.id}&l=english`);
        const gameData = detailRes.data[matchedApp.id];

        if (!gameData.success) {
            return res.status(404).json({ message: 'Steam has no detailed data for this app ID.' });
        }

        const d = gameData.data;

        // 3. Format for Ecliptix Frontend
        const ecliptixData = {
            title: d.name,
            shortDescription: stripHtml(d.short_description),
            description: stripHtml(d.about_the_game || d.detailed_description).replace(/\n/g, '\n\n'), 
            developer: d.developers ? d.developers[0] : 'N/A',
            publisher: d.publishers ? d.publishers[0] : 'N/A',
            releaseDate: d.release_date && d.release_date.date ? d.release_date.date : '',
            genres: d.genres ? d.genres.map(g => g.description) : [],
            coverImage: d.header_image,
            images: d.screenshots ? d.screenshots.map(s => s.path_full) : [],
            systemRequirements: {
                minimum: parseRequirements(d.pc_requirements ? d.pc_requirements.minimum : '', true, d.name),
                recommended: parseRequirements(d.pc_requirements ? d.pc_requirements.recommended : '', false, d.name)
            }
        };

        res.json(ecliptixData);
    } catch (err) {
        console.error('Steam Fetch Error:', err.message);
        res.status(500).json({ message: 'Error fetching data from Steam API.' });
    }
});

module.exports = router;
