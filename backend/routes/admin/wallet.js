const express = require('express');
const User = require('../../models/User');
const auth = require('../../middleware/auth');
const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin route to manipulate wallet
router.post('/manipulate', auth, isAdmin, async (req, res) => {
  try {
    const { action, amount } = req.body;
    
    if (!['add', 'subtract', 'set'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use add, subtract, or set.' });
    }
    
    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ message: 'Invalid amount.' });
    }

    const user = await User.findById(req.user._id);
    
    if (action === 'add') {
      user.wallet += Number(amount);
    } else if (action === 'subtract') {
      user.wallet = Math.max(0, user.wallet - Number(amount));
    } else if (action === 'set') {
      user.wallet = Number(amount);
    }

    await user.save();
    
    res.json({ 
      message: `Wallet updated successfully. Action: ${action}, Amount: ${amount}`,
      wallet: user.wallet 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
