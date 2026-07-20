require('dotenv').config();
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    const order = await razorpay.orders.create({
      amount: 50000,
      currency: 'INR',
      receipt: 'test_123',
    });
    console.log("Success:", order);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
