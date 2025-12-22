const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/wallet/add
// @desc    Add funds to user wallet
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update wallet balance
    user.wallet = (user.wallet || 0) + parseFloat(amount);
    await user.save();

    res.json({ 
      message: 'Funds added successfully', 
      newBalance: user.wallet 
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;