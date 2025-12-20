const express = require('express');
const User = require('../models/User');
const Game = require('../models/Game');
const auth = require('../middleware/auth');
const router = express.Router();

// Get cart
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cart.game');
    res.json(user.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add to cart
router.post('/add/:gameId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already in cart
    if (user.cart.some(item => item.game.toString() === req.params.gameId)) {
      return res.status(400).json({ message: 'Game already in cart' });
    }

    // Check if already owned
    if (user.ownedGames.includes(req.params.gameId)) {
      return res.status(400).json({ message: 'Game already owned' });
    }

    user.cart.push({ game: req.params.gameId });
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .populate('cart.game');
    
    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove from cart
router.delete('/remove/:gameId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = user.cart.filter(
      item => item.game.toString() !== req.params.gameId
    );
    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .populate('cart.game');
    
    res.json(updatedUser.cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Clear cart
router.delete('/clear', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

