const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user orders
router.get('/', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('games.game')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create order from cart
router.post('/checkout', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('cart.game');
    
    if (user.cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Calculate total
    let totalAmount = 0;
    const games = [];

    for (const item of user.cart) {
      const game = item.game;
      const finalPrice = game.discount > 0 
        ? game.price * (1 - game.discount / 100) 
        : game.price;
      
      // Check if already owned
      if (user.ownedGames.includes(game._id)) {
        continue;
      }

      totalAmount += finalPrice;
      games.push({
        game: game._id,
        price: finalPrice
      });
    }

    if (games.length === 0) {
      return res.status(400).json({ message: 'All games in cart are already owned' });
    }

    // Check wallet balance
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

    // Update user: deduct wallet, add games to owned, clear cart
    user.wallet -= totalAmount;
    games.forEach(item => {
      if (!user.ownedGames.includes(item.game)) {
        user.ownedGames.push(item.game);
      }
    });
    user.cart = [];
    await user.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('games.game');

    res.status(201).json(populatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add funds to wallet
router.post('/wallet/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    user.wallet += parseFloat(amount);
    await user.save();

    res.json({ wallet: user.wallet });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

