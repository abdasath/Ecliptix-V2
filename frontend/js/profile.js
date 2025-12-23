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
  const addFundsBtn = document.getElementById('addFundsBtn');
  
  if (addFundsBtn) {
    addFundsBtn.addEventListener('click', handleAddFunds);
  }
}

/* --- Logic for Adding Funds based on Role --- */
async function handleAddFunds() {
  const amountInput = document.getElementById('fundAmount');
  const amount = parseFloat(amountInput?.value);

  if (!amount || amount <= 0) {
    showNotification('Please enter a valid amount', 'error');
    return;
  }

  // SANA'S LOGIC FIX: Check user role before allowing addition
  const user = getCurrentUser(); // Uses helper in auth.js
  const USER_LIMIT = 10000; // Define a limit for standard users

  if (user.role !== 'admin' && amount > USER_LIMIT) {
    showNotification(`Max limit: ₹${USER_LIMIT.toLocaleString()}`, 'error');
    return;
  }

  try {
    const response = await walletAPI.addFunds(amount); //
    showNotification(`₹${amount} added successfully!`, 'success');
    
    // Refresh user data to update the UI
    checkAuthStatus(); 
  } catch (error) {
    showNotification(error.message || 'Failed to add funds', 'error');
  }
}

// Show login prompt
function showLoginPrompt() {
  const profileSection = document.querySelector('.profile-section');
  if (profileSection) {
    profileSection.innerHTML = `
      <div class="empty-state">
        <p>Please login to view your profile</p>
        <button class="btn-primary" onclick="document.getElementById('loginModal').style.display='block'">Login</button>
      </div>
    `;
  }
}

