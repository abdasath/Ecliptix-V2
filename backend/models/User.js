const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if the user is not signing in via Google
      return !this.googleId;
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null/undefined values
  },
  role: { type: String, default: 'user' },
  
  wallet: { type: Number, default: 0 },

  // --- NEW: Track history to calculate daily limits ---
  walletHistory: [{
    amount: Number,
    type: { type: String, enum: ['deposit', 'purchase', 'refund'] },
    date: { type: Date, default: Date.now }
  }],
  // ----------------------------------------------------

  ownedGames: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  }],
  cart: [{
    game: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);