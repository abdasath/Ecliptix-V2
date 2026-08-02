// Profile Management
let userProfile = null;
let orderHistory = [];

// Initialize profile on page load
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    loadProfile();
    loadOrderHistory();
    setupWalletActions();
  } else {
    showLoginPrompt();
  }
});

// Load user profile
async function loadProfile() {
  if (!isAuthenticated()) {
    showLoginPrompt();
    return;
  }

  try {
    const user = await authAPI.getCurrentUser();
    userProfile = user;
    displayProfile(user);
  } catch (error) {
    console.error('Failed to load profile:', error);
    showLoginPrompt();
  }
}

// Display profile information
function displayProfile(user) {
  const usernameEl = document.getElementById('profileUsername');
  const emailEl = document.getElementById('profileEmail');
  const dateEl = document.getElementById('profileDate');
  const walletEl = document.getElementById('profileWallet');

  if (usernameEl) usernameEl.textContent = user.username || '-';
  if (emailEl) emailEl.textContent = user.email || '-';
  if (dateEl) {
    const date = user.createdAt ? new Date(user.createdAt) : new Date();
    dateEl.textContent = date.toLocaleDateString();
  }
  if (walletEl) {
    walletEl.textContent = (user.wallet || 0).toLocaleString('en-IN');
  }

  // Update wallet in nav
  const userWallet = document.getElementById('userWallet');
  if (userWallet) {
    userWallet.textContent = `₹${(user.wallet || 0).toLocaleString('en-IN')}`;
  }

  // Show Admin Controls if applicable
  const adminWalletControls = document.getElementById('adminWalletControls');
  if (adminWalletControls && user.role === 'admin') {
    adminWalletControls.style.display = 'block';
  }
}

// Admin Wallet Manipulation API Call
async function manipulateWallet(action) {
  const amountInput = document.getElementById('adminWalletAmount');
  const amount = Number(amountInput.value);

  if (!amountInput.value || isNaN(amount) || amount < 0) {
    alert('Please enter a valid amount.');
    return;
  }

  try {
    const res = await apiRequest('/api/admin/wallet/manipulate', {
      method: 'POST',
      body: { action, amount }
    });

    if (res && res.wallet !== undefined) {
      // Update UI immediately without needing a full reload
      const walletEl = document.getElementById('profileWallet');
      const navWalletEl = document.getElementById('userWallet');
      
      if (walletEl) walletEl.textContent = res.wallet.toLocaleString('en-IN');
      if (navWalletEl) navWalletEl.textContent = `₹${res.wallet.toLocaleString('en-IN')}`;
      
      amountInput.value = ''; // clear input
      
      // Optional: Add a small visual success indicator
      amountInput.style.borderColor = '#28a745';
      setTimeout(() => amountInput.style.borderColor = '#333', 2000);
    }
  } catch (error) {
    console.error('Wallet manipulation failed:', error);
    alert('Failed to update wallet: ' + error.message);
  }
}

// Load order history
async function loadOrderHistory() {
  if (!isAuthenticated()) return;

  try {
    const orders = await ordersAPI.getAll();
    orderHistory = orders;
    displayOrderHistory(orders);
  } catch (error) {
    console.error('Failed to load order history:', error);
  }
}

// Display order history
function displayOrderHistory(orders) {
  const container = document.getElementById('orderHistory');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<p class="empty-state">No purchase history</p>';
    return;
  }

  container.innerHTML = orders.map(order => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const gamesList = order.games.map(item => {
      const game = item.game;
      return `<div class="order-game">• ${game.title} - ₹${item.price.toLocaleString('en-IN')}</div>`;
    }).join('');

    return `
      <div class="order-item">
        <div class="order-header">
          <span class="order-date">${date}</span>
          <span class="order-total">Total: ₹${order.totalAmount.toLocaleString('en-IN')}</span>
        </div>
        <div class="order-games">
          ${gamesList}
        </div>
        <div style="margin-top: 0.5rem;">
          <span class="badge badge-${order.status}">${order.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Setup wallet actions
function setupWalletActions() {
  // Legacy addFundsBtn support (not used now — Razorpay button handles it inline)
  const addFundsBtn = document.getElementById('addFundsBtn');
  if (addFundsBtn) {
    addFundsBtn.addEventListener('click', handleAddFunds);
  }

  // Check for payment result query params (Razorpay redirects back here)
  const params = new URLSearchParams(window.location.search);
  if (params.get('payment') === 'success') {
    showNotification('Payment successful! Wallet updated.', 'success');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (params.get('payment') === 'cancel') {
    showNotification('Payment cancelled.', 'info');
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// Quick amount chip helper
function setAmount(value) {
  const input = document.getElementById('fundAmount');
  if (input) {
    input.value = value;
    // Highlight active chip
    document.querySelectorAll('.chip-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
  }
}

// ─────────────────────────────────────────────
// RAZORPAY PAYMENT FLOW
// ─────────────────────────────────────────────
async function handleRazorpayPayment() {
  const amountInput = document.getElementById('fundAmount');
  const amount = parseFloat(amountInput?.value);

  if (!amount || amount <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }

  if (amount > 5000) {
    showNotification('Maximum ₹5,000 per transaction', 'error');
    return;
  }

  const btn = document.getElementById('razorpayBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating order...';
  }

  try {
    // ── Step 1: Create order on backend ──
    const orderData = await paymentAPI.createOrder(amount);

    // ── Step 2: Open Razorpay Checkout Popup ──
    const options = {
      key: orderData.keyId,
      amount: orderData.amount,         // in paise
      currency: orderData.currency,
      name: 'Ecliptix',
      description: `Add ₹${amount.toLocaleString('en-IN')} to Wallet`,
      image: 'https://i.pinimg.com/736x/07/3e/90/073e9014436b6ce0c67ebded83e854ff.jpg',
      order_id: orderData.orderId,

      // ── Step 3: Called by Razorpay when payment succeeds ──
      handler: async function (response) {
        showNotification('Verifying payment...', 'info');

        try {
          // ── Step 4: Verify signature on backend ──
          const result = await paymentAPI.verifyPayment({
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature,
            amount: orderData.amount,   // in paise — backend converts back
          });

          // ── Step 5: Update UI with new balance ──
          showNotification(result.message, 'success');

          // Refresh wallet display
          const walletEl = document.getElementById('profileWallet');
          const navWallet = document.getElementById('userWallet');
          if (walletEl) walletEl.textContent = result.wallet.toLocaleString('en-IN');
          if (navWallet) navWallet.textContent = `₹${result.wallet.toLocaleString('en-IN')}`;

          // Update localStorage user info
          const savedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
          savedUser.wallet = result.wallet;
          localStorage.setItem('userInfo', JSON.stringify(savedUser));

          // Clear input + chip highlight
          if (amountInput) amountInput.value = '';
          document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));

        } catch (verifyError) {
          showNotification(verifyError.message || 'Verification failed. Contact support.', 'error');
        }
      },

      prefill: {
        name:    orderData.userName  || '',
        email:   orderData.userEmail || '',
        contact: '',
      },

      theme: {
        color: '#0074e4',   // Ecliptix blue
        hide_topbar: false,
      },

      // Enable all payment methods explicitly
      config: {
        display: {
          blocks: {
            upi: {
              name: 'Pay via UPI',
              instruments: [{ method: 'upi' }],
            },
            card: {
              name: 'Pay via Card',
              instruments: [{ method: 'card' }],
            },
          },
          sequence: ['block.upi', 'block.card'],
          preferences: { show_default_blocks: true },
        },
      },

      modal: {
        ondismiss: function () {
          showNotification('Payment cancelled.', 'info');
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
      showNotification(`Payment failed: ${response.error.description}`, 'error');
      console.error('Razorpay payment failed:', response.error);
    });

    rzp.open();

  } catch (error) {
    showNotification(error.message || 'Failed to initiate payment. Try again.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bx bx-credit-card"></i> Pay with Razorpay';
    }
  }
}

/* --- Legacy handleAddFunds (kept for backward compat) --- */
async function handleAddFunds() {
  handleRazorpayPayment();
}

// Show login prompt
function showLoginPrompt() {
  const profileSection = document.querySelector('.profile-section');
  if (profileSection) {
    // FIX: Changed onclick to use your global openLoginModal() function
    profileSection.innerHTML = `
      <div class="empty-state">
        <p>Please login to view your profile</p>
        <button class="btn-primary" onclick="openLoginModal()">Login</button>
      </div>
    `;
  }
}

