const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const redis = require('../config/redis');
const router = express.Router();

// ─────────────────────────────────────────────
// Razorpay Instance (Test Mode)
// ─────────────────────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DAILY_LIMIT = 5000; // ₹5,000/day — covers 1-2 premium games
const MAX_TRANSACTION = 5000; // max per single top-up

// ─────────────────────────────────────────────
// POST /api/payment/create-order
// Step 1: Create a Razorpay order on backend
// Frontend then opens the Razorpay popup with this order
// ─────────────────────────────────────────────
router.post('/create-order', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    const addAmount = parseFloat(amount);

    if (!addAmount || addAmount <= 0 || addAmount > MAX_TRANSACTION) {
      return res.status(400).json({ message: `Invalid amount. Must be between ₹1 and ₹${MAX_TRANSACTION.toLocaleString('en-IN')}.` });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Daily limit check for regular users
    if (user.role !== 'admin') {
      let depositedToday = 0;
      try {
        if (redis.status === 'ready') {
          const today = new Date().toISOString().split('T')[0];
          const val = await redis.get(`wallet:daily:${user._id}:${today}`);
          depositedToday = val ? parseFloat(val) : 0;
        }
      } catch {}

      if (depositedToday + addAmount > DAILY_LIMIT) {
        const remaining = DAILY_LIMIT - depositedToday;
        return res.status(400).json({
          message: `Daily limit reached. You can still add ₹${remaining.toLocaleString('en-IN')} today.`
        });
      }
    }

    // Create Razorpay order
    // Amount must be in paise (1 INR = 100 paise)
    // receipt must be <= 40 chars: "rcpt_" + last8ofUserId + "_" + shortTimestamp
    const shortId = user._id.toString().slice(-8);
    const shortTs = Date.now().toString().slice(-8);
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(addAmount * 100), // convert to paise
      currency: 'INR',
      receipt: `rcpt_${shortId}_${shortTs}`,  // max ~22 chars — well under 40
      notes: {
        userId: user._id.toString(),
        purpose: 'wallet_topup',
      },
    });

    console.log(`💳 Razorpay order created: ${razorpayOrder.id} for ₹${addAmount}`);

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,       // in paise
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID, // safe to send to frontend
      userName: user.username,
      userEmail: user.email,
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order. Try again.' });
  }
});

// ─────────────────────────────────────────────
// POST /api/payment/verify
// Step 2: After user pays, Razorpay calls frontend success handler
// Frontend sends payment details here for cryptographic verification
// We NEVER trust the frontend — we verify the signature ourselves
// ─────────────────────────────────────────────
router.post('/verify', auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // ── 1. Check Redis for duplicate payment (idempotency) ──
    try {
      if (redis.status === 'ready') {
        const alreadyProcessed = await redis.get(`payment:${razorpay_payment_id}`);
        if (alreadyProcessed) {
          return res.status(400).json({ message: 'Payment already processed' });
        }
      }
    } catch {}

    // ── 2. Cryptographic Signature Verification ──
    // Razorpay signs: order_id + "|" + payment_id using your key_secret
    // We replicate this and compare — if they match, payment is genuine
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Razorpay signature mismatch — possible tamper attempt!');
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    console.log(`✅ Payment verified: ${razorpay_payment_id}`);

    // ── 3. Credit wallet in MongoDB ──
    const addAmount = parseFloat(amount) / 100; // convert paise back to INR
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.wallet += addAmount;
    user.walletHistory.push({
      amount: addAmount,
      type: 'deposit',
      date: new Date(),
    });
    await user.save();

    // ── 4. Update Redis daily deposit counter ──
    try {
      if (redis.status === 'ready' && user.role !== 'admin') {
        const today = new Date().toISOString().split('T')[0];
        const key = `wallet:daily:${user._id}:${today}`;
        await redis.incrbyfloat(key, addAmount);
        await redis.expire(key, 86400);
      }
    } catch {}

    // ── 5. Mark payment as processed in Redis (prevent duplicates) ──
    try {
      if (redis.status === 'ready') {
        await redis.setex(`payment:${razorpay_payment_id}`, 86400, '1');
      }
    } catch {}

    console.log(`💰 Wallet credited: ₹${addAmount} → User ${user.username} | New balance: ₹${user.wallet}`);

    res.json({
      message: `₹${addAmount.toLocaleString('en-IN')} added to your wallet!`,
      wallet: user.wallet,
      paymentId: razorpay_payment_id,
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Payment verification failed. Contact support.' });
  }
});

// ─────────────────────────────────────────────
// GET /api/payment/key
// Returns Razorpay public key to frontend
// ─────────────────────────────────────────────
router.get('/key', auth, (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = router;
