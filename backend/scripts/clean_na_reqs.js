const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Game = require('../models/Game');

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

    let pool = [];
    if (field === 'os' || field === 'storage') {
        pool = pools[field];
    } else {
        pool = pools[field + (isMin ? '_min' : '_rec')];
    }

    return pool[hash % pool.length];
}

async function cleanDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Scanning database for N/A system requirements...');
    
    const games = await Game.find({});
    let updatedCount = 0;

    for (const game of games) {
        let modified = false;
        
        if (!game.systemRequirements) {
            game.systemRequirements = { minimum: {}, recommended: {} };
            modified = true;
        }

        const reqs = game.systemRequirements;
        if (!reqs.minimum) reqs.minimum = {};
        if (!reqs.recommended) reqs.recommended = {};

        const fields = ['os', 'processor', 'memory', 'graphics', 'storage'];
        
        const isBad = (val) => {
            if (!val) return true;
            const lower = val.toLowerCase();
            return lower === 'n/a' || lower === 'undefined' || lower.includes('not specified') || val.trim() === '';
        };

        // Fix Minimum
        for (const f of fields) {
            if (isBad(reqs.minimum[f])) {
                reqs.minimum[f] = getFallback(f, true, game.title);
                modified = true;
            }
        }

        // Fix Recommended
        for (const f of fields) {
            if (isBad(reqs.recommended[f])) {
                reqs.recommended[f] = getFallback(f, false, game.title);
                modified = true;
            }
        }

        if (modified) {
            game.markModified('systemRequirements');
            await game.save();
            console.log(`✅ Cleaned up N/A data for: ${game.title}`);
            updatedCount++;
        }
    }
    
    console.log(`Finished! Successfully repaired ${updatedCount} games.`);
    process.exit(0);
}

cleanDB();
