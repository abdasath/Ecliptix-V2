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
// Server-side order verification helpers
// The amount credited at /verify is ALWAYS resolved from the server
// (Redis record captured at create-order + cross-check with Razorpay),
// and is never taken from req.body.amount sent by the client.
// ─────────────────────────────────────────────
async function getDepositedToday(userId) {
  try {
    if (redis.status === 'ready') {
      const today = new Date().toISOString().split('T')[0];
      const val = await redis.get(`wallet:daily:${userId}:${today}`);
      return val ? parseFloat(val) : 0;
    }
  } catch (err) {
    console.warn('Daily limit read failed:', err.message);
  }
  return 0;
}

async function resolveVerifiedOrderInfo(orderId, userId, rp = razorpay) {
  // ⚠️ ROOT-CAUSE FIX: req.user._id is a Mongoose ObjectId while the stored
  // record and Razorpay notes store userId as a plain string. Normalize once
  // so an identical user always matches regardless of representation.
  const uid = String(userId);

  console.log(`🔎 verify: resolving order ${orderId} for user ${uid} (redis=${redis.status})`);

  // 1) Server-stored record captured at CREATE-ORDER time
  try {
    if (redis.status === 'ready') {
      const raw = await redis.get(`payment:order:${orderId}`);
      if (raw) {
        const rec = JSON.parse(raw);
        if (!rec || rec.userId !== uid) {
          console.warn(`❌ stored record mismatch: storedUserId=${rec && rec.userId} authUserId=${uid}`);
          return null; // order belongs to another account
        }
        console.log(`📦 stored record found: amountPaise=${rec.amountPaise} userId=${rec.userId}`);

        const paidState = await razorpayOrderIsPaid(rp, orderId);
        if (paidState === false) {
          console.warn(`❌ Razorpay confirms order ${orderId} is NOT paid`); // legit payment's state never reached
          return null;
        }

        // paidState === true → paid. paidState === null → Razorpay unreachable;
        // the HMAC signature already proved the payment, so the signed
        // server-stored record is the authoritative amount.
        return { amountPaise: rec.amountPaise, paid: true };
      }
      console.log(`📭 no stored record for order ${orderId} (missing or TTL expired)`);
    }
  } catch (err) {
    console.warn('Could not read stored order:', err.message);
  }

  // 2) Fallback: query Razorpay directly (authoritative source)
  try {
    const rpOrder = await fetchRazorpayOrder(rp, orderId);
    const notesUser = rpOrder.notes && rpOrder.notes.userId;
    console.log(`🔎 Razorpay fetch: order=${orderId} status=${rpOrder.status} amount=${rpOrder.amount}`);

    if (notesUser && notesUser !== uid) {
      console.warn(`❌ Razorpay order belongs to ${notesUser}, not ${uid}`);
      return null;
    }

    if (rpOrder.status !== 'paid') {
      // Payment-level fallback: a *captured* payment proves the wallet credit
      try {
        const payments = await rp.orders.fetchPayments(orderId);
        if (payments && Array.isArray(payments.items) &&
            payments.items.some((p) => p.status === 'captured')) {
          console.log('🔎 payment-level status = captured -> accepted');
          return { amountPaise: Number(rpOrder.amount), paid: true };
        }
      } catch (payErr) {
        console.warn('Payment-level check unavailable:', payErr.message);
      }
      console.warn(`❌ Fallback: Razorpay order ${orderId} not paid (status=${rpOrder.status})`);
      return null;
    }

    return { amountPaise: Number(rpOrder.amount), paid: true };
  } catch (err) {
    console.error('Razorpay order fetch failed:', err.message);
    return null;
  }
}

// Bounded fetch: tolerate brief upstream/state propagation (max ~1.8s total).
// Returns the order, or throws after the retry budget is exhausted.
async function fetchRazorpayOrder(rp, orderId) {
  let lastErr;
  for (let i = 1; i <= 3; i++) {
    try {
      return await rp.orders.fetch(orderId);
    } catch (err) {
      lastErr = err;
    }
    if (i < 3) await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw lastErr || new Error('Razorpay order fetch failed after retries');
}

// true  = order paid / a payment captured
// false = Razorpay explicitly shows not-paid (after the bounded retry)
// null  = Razorpay unreachable (state unknown) — caller falls back to signed record
async function razorpayOrderIsPaid(rp, orderId) {
  let order;
  try {
    order = await fetchRazorpayOrder(rp, orderId);
  } catch (err) {
    console.warn('Razorpay order state unobtainable:', err.message);
    return null;
  }

  if (order.status === 'paid') {
    console.log(`🔎 Razorpay order state: paid (amount=${order.amount})`);
    return true;
  }

  try {
    const payments = await rp.orders.fetchPayments(orderId);
    if (payments && Array.isArray(payments.items) &&
        payments.items.some((p) => p.status === 'captured')) {
      console.log('🔎 Payment-level state: captured');
      return true;
    }
  } catch (payErr) {
    console.warn('Payment-level check unavailable:', payErr.message);
  }

  console.log(`🔎 Razorpay order NOT confirmed paid (status=${order.status})`);
  return false;
}

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

    // ── Store the authoritative order amount server-side ──
    // /verify reads THIS amount (never the client-sent amount), so a
    // tampered "amount" in the verify request can never inflate the credit.
    try {
      if (redis.status === 'ready') {
        await redis.setex(`payment:order:${razorpayOrder.id}`, 86400, JSON.stringify({
          amountPaise: razorpayOrder.amount,
          userId: user._id.toString(),
        }));
      }
    } catch (storeErr) {
      console.warn('⚠️ Could not cache order amount:', storeErr.message);
    }

    console.log(`🗂 Stored server-side record: order=${razorpayOrder.id} amountPaise=${razorpayOrder.amount} userId=${user._id.toString()} redis=${redis.status}`);

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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // ── 1. Cryptographic Signature Verification ──
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
    console.log(`🔐 Signature matched — order=${razorpay_order_id} payment=${razorpay_payment_id} user=${req.user._id.toString()}`);

    // ── 2. Resolve the REAL amount server-side — NEVER req.body.amount ──
    // The client only ever reports which payment happened; the server decides
    // how much was paid (authoritative order record + Razorpay cross-check).
    const orderInfo = await resolveVerifiedOrderInfo(razorpay_order_id, req.user._id, razorpay);
    if (!orderInfo) {
      return res.status(400).json({ message: 'Could not verify this payment order.' });
    }
    const addAmount = orderInfo.amountPaise / 100; // paise -> INR
    console.log(`🧾 Authoritative amount resolved: ${orderInfo.amountPaise} paise = ₹${addAmount} (client amount NOT trusted)`);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // ── 3. Re-apply the daily top-up limit at verification time ──
    // (an attacker must not be able to bypass the limit by skipping create-order)
    if (user.role !== 'admin') {
      const depositedToday = await getDepositedToday(user._id);
      if (depositedToday + addAmount > DAILY_LIMIT) {
        const remaining = Math.max(0, DAILY_LIMIT - depositedToday);
        return res.status(400).json({
          message: `Daily limit reached. You can still add ₹${remaining.toLocaleString('en-IN')} today.`
        });
      }
    }

    // ── 4. Claim idempotency markers BEFORE crediting (replay/double-credit guard) ──
    const dupKey = `payment:${razorpay_payment_id}`;
    const orderKey = `payment:done:${razorpay_order_id}`;
    if (redis.status === 'ready') {
      try {
        const claimedPayment = await redis.set(dupKey, '1', 'EX', 86400, 'NX');
        if (!claimedPayment) {
          return res.status(400).json({ message: 'Payment already processed.' });
        }
        const claimedOrder = await redis.set(orderKey, '1', 'EX', 86400, 'NX');
        if (!claimedOrder) {
          return res.status(400).json({ message: 'This order payment was already processed.' });
        }
      } catch (claimErr) {
        console.warn('Idempotency guard failed:', claimErr.message);
      }
    }

    try {
      // ── 5. Credit wallet in MongoDB ──
      user.wallet += addAmount;
      user.walletHistory.push({
        amount: addAmount,
        type: 'deposit',
        date: new Date(),
      });
      await user.save();
    } catch (saveErr) {
      // Roll back idempotency markers so the user can retry safely
      if (redis.status === 'ready') {
        try { await redis.del(dupKey, orderKey); } catch (e) {}
      }
      throw saveErr;
    }

    // ── 6. Update Redis daily deposit counter ──
    try {
      if (redis.status === 'ready' && user.role !== 'admin') {
        const today = new Date().toISOString().split('T')[0];
        const key = `wallet:daily:${user._id}:${today}`;
        await redis.incrbyfloat(key, addAmount);
        await redis.expire(key, 86400);
      }
    } catch (err) {
      console.warn('Daily counter update failed:', err.message);
    }

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
// Test hooks: exported so security unit-tests can verify the server-side
// amount resolution used by the /verify endpoint.
module.exports._resolveVerifiedOrderInfo = resolveVerifiedOrderInfo;
module.exports._getDepositedToday = getDepositedToday;
