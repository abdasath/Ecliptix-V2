const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const { walletLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// ─────────────────────────────────────────────
// Daily Wallet Limit via Redis
// Key: wallet:daily:{userId}:{YYYY-MM-DD}
// Auto-expires after 24 hours
// Much faster than scanning walletHistory array
// ─────────────────────────────────────────────
const DAILY_LIMIT = 50000;

async function getDailyDeposited(userId) {
  try {
    if (redis.status !== 'ready') return 0; // fallback: don't block
    const today = new Date().toISOString().split('T')[0]; // "2026-06-20"
    const key = `wallet:daily:${userId}:${today}`;
    const val = await redis.get(key);
    return val ? parseFloat(val) : 0;
  } catch {
    return 0; // Redis offline fallback
  }
}

async function incrementDailyDeposit(userId, amount) {
  try {
    if (redis.status !== 'ready') return;
    const today = new Date().toISOString().split('T')[0];
    const key = `wallet:daily:${userId}:${today}`;
    await redis.incrbyfloat(key, amount);
    await redis.expire(key, 86400); // auto-expire in 24 hours
  } catch {}
}

// ─────────────────────────────────────────────
// GET /api/orders — Get user order history
// ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('games.game')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Ecliptix route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/checkout — Create order from cart
// ─────────────────────────────────────────────
router.post('/checkout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.game');

    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const games = [];

    for (const item of user.cart) {
      const game = item.game;
      const finalPrice = game.discount > 0
        ? game.price * (1 - game.discount / 100)
        : game.price;

      if (user.ownedGames.includes(game._id)) {
        continue;
      }

      totalAmount += finalPrice;
      games.push({ game: game._id, price: finalPrice });
    }

    if (games.length === 0) {
      return res.status(400).json({ message: 'All games in cart are already owned' });
    }

    if (user.wallet < totalAmount) {
      return res.status(400).json({
        message: 'Insufficient wallet balance',
        required: totalAmount,
        available: user.wallet
      });
    }

    // Create order
    const order = new Order({
      user: user._id,
      games,
      totalAmount,
      status: 'completed'
    });
    await order.save();

    // Update user wallet, owned games, clear cart
    user.wallet -= totalAmount;
    games.forEach(item => {
      if (!user.ownedGames.includes(item.game)) {
        user.ownedGames.push(item.game);
      }
    });
    user.cart = [];
    await user.save();

    const populatedOrder = await Order.findById(order._id).populate('games.game');
    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Ecliptix route error:', error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/orders/wallet/add — Add funds to wallet
// Uses Redis for daily limit tracking (fast)
// Falls back to walletHistory scan if Redis offline
// Rate limited: 10 requests/hour
// ─────────────────────────────────────────────
router.post('/wallet/add', auth, walletLimiter, async (req, res) => {
  try {
    const { amount } = req.body;
    const addAmount = parseFloat(amount);

    if (!addAmount || addAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ─── Daily Limit Check (Skip for Admins) ───
    if (user.role !== 'admin') {
      let depositedToday = 0;

      if (redis.status === 'ready') {
        // FAST PATH: Redis key-based daily tracking
        depositedToday = await getDailyDeposited(user._id);
        console.log(`⚡ Redis daily limit check: ₹${depositedToday} deposited today`);
      } else {
        // FALLBACK: Scan walletHistory in MongoDB (slow, but safe)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const history = user.walletHistory || [];
        depositedToday = history
          .filter(e => e.type === 'deposit' && new Date(e.date) >= startOfToday)
          .reduce((sum, e) => sum + e.amount, 0);
        console.log('⚠️  Redis offline — using DB fallback for daily limit');
      }

      if (depositedToday + addAmount > DAILY_LIMIT) {
        const remaining = DAILY_LIMIT - depositedToday;
        return res.status(400).json({
          message: `Daily limit reached. You can still add ₹${remaining.toLocaleString('en-IN')} today. Limit is ₹${DAILY_LIMIT.toLocaleString('en-IN')}.`
        });
      }
    }

    // ─── Update Wallet in MongoDB ───
    user.wallet += addAmount;

    // Also update walletHistory for audit trail
    user.walletHistory.push({
      amount: addAmount,
      type: 'deposit',
      date: new Date()
    });

    await user.save();

    // ─── Update Redis daily counter ───
    if (user.role !== 'admin') {
      await incrementDailyDeposit(user._id, addAmount);
    }

    res.json({
      message: 'Funds added successfully',
      wallet: user.wallet
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
