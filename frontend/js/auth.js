// Authentication Management
let currentUser = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupAuthModals();
});

// Check if user is logged in
/* --- Update in auth.js --- */
async function checkAuthStatus() {
  const token = localStorage.getItem('token');
  const savedUser = localStorage.getItem('userInfo');

  if (!token) {
    handleLoggedOutCleanup();
    return;
  }

  // Immediately show UI based on saved data while we verify the token
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUIForLoggedIn(currentUser);
    checkAdminAccess(); // This shows the admin link immediately
  }

  try {
    const user = await authAPI.getCurrentUser();
    currentUser = user;
    localStorage.setItem('userInfo', JSON.stringify(user));
    updateUIForLoggedIn(user);
    checkAdminAccess();
  } catch (error) {
    console.error('Auth check failed:', error);
    // ONLY logout if it's a 401 Unauthorized error
    if (error.status === 401) {
      handleLogout();
    }
  }
}

// 1. Update the Clear Fields helper to use the new prefixed IDs
function clearAuthFields() {
  const fields = [
    'regUsername', 
    'loginEmail', 
    'regEmail', 
    'loginPassword', 
    'regPassword'
  ];

  fields.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.value = ''; // Safety check: only sets if element exists
    }
  });

  const regUsername = document.getElementById('regUsername');
  const loginEmail = document.getElementById('loginEmail');
  const regEmail = document.getElementById('regEmail');
  const loginPassword = document.getElementById('loginPassword');
  const regPassword = document.getElementById('regPassword');

  if (regUsername) regUsername.value = '';
  if (loginEmail) loginEmail.value = '';
  if (regEmail) regEmail.value = '';
  if (loginPassword) loginPassword.value = '';
  if (regPassword) regPassword.value = '';
}

// Helper for clean state
function handleLoggedOutCleanup() {
  currentUser = null;
  localStorage.removeItem('userInfo');
  updateUIForLoggedOut();
  checkAdminAccess();
}

// Add this helper function at the top of auth.js
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/* --- Updated handleRegister in auth.js (Removes Alerts) --- */
async function handleRegister() {
  const username = document.getElementById('regUsername')?.value;
  const emailInput = document.getElementById('regEmail');
  const password = document.getElementById('regPassword')?.value;

  if (emailInput && !emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  const email = emailInput?.value;

  if (!username || !email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showNotification('Invalid email address', 'error');
    return;
  }

  if (password.length < 6) {
    // REPLACED ALERT
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const response = await authAPI.register(username, email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('userInfo', JSON.stringify(response.user));

    currentUser = response.user;
    updateUIForLoggedIn(response.user);
    checkAdminAccess();
    closeLoginModal();

    // Clear form
    clearAuthFields();

    showNotification('Registration successful!', 'success');
  } catch (error) {
    showNotification(error.message || 'Registration failed', 'error');
  }
}

/* --- Update in auth.js --- */
function checkAdminAccess() {
  const userString = localStorage.getItem('userInfo');
  const adminLink = document.querySelector('a[href="admin.html"]');

  if (!adminLink) return;

  // Target the parent <li> to maintain flexbox spacing
  const adminNavItem = adminLink.parentElement;

  if (userString) {
    const user = JSON.parse(userString);

    if (user.role === 'admin') {
      // Show the whole list item so it flows perfectly in the menu
      adminNavItem.style.setProperty('display', 'block', 'important');
      adminLink.style.setProperty('display', 'inline-block', 'important');
    } else {
      adminNavItem.style.setProperty('display', 'none', 'important');
    }
  } else {
    adminNavItem.style.setProperty('display', 'none', 'important');
  }
}

// Run this when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);


// Setup login/register modals
function setupAuthModals() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginModal = document.getElementById('loginModal');
  const closeBtn = loginModal?.querySelector('.close');
  const loginSubmitBtn = document.getElementById('loginSubmitBtn');
  const registerSubmitBtn = document.getElementById('registerSubmitBtn');
  const authContainer = document.getElementById('authContainer');
  const toRegisterBtn = document.getElementById('toRegister');
  const toLoginBtn = document.getElementById('toLogin');

  // Toggle logic for the sliding effect
    if (toRegisterBtn && toLoginBtn) {
        toRegisterBtn.addEventListener('click', () => {
            authContainer.classList.add('active');
        });
        toLoginBtn.addEventListener('click', () => {
            authContainer.classList.remove('active');
        });
    }

  if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    clearAuthFields(); // Correctly clears fields
    openLoginModal();  // FIX: Calls the smooth transition function
  });
}

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    closeLoginModal(); // FIX: Calls the smooth fade-out function
  });
}

  if (loginModal) {
    window.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
      }
    });
  }

  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', handleLogin);
  }

  if (registerSubmitBtn) {
    registerSubmitBtn.addEventListener('click', handleRegister);
  }
}


/* --- Updated handleLogin in auth.js (Removes Alerts) --- */
async function handleLogin() {
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');

  if (emailInput && !emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  const email = emailInput?.value;
  const password = passwordInput?.value;

  if (!email || !password) {
    showNotification('Please fill in all fields', 'error');
    return;
  }

  try {
    const response = await authAPI.login(email, password);
    if (response && response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('userInfo', JSON.stringify(response.user));
      currentUser = response.user;

      updateUIForLoggedIn(response.user);
      checkAdminAccess();
      closeLoginModal();

      if (typeof loadCart === 'function') {
        await loadCart();
      }

      showNotification('Login successful!', 'success');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    }
  } catch (error) {
    console.error('Login Error:', error);
    if (error.status === 401) {
      // REPLACED ALERT
      showNotification('Account not found. Please register first!', 'error');
    } else {
      // REPLACED ALERT
      showNotification(error.message || 'Login failed', 'error');
    }
  }
}


/* --- Update handleLogout in js/auth.js --- */
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  currentUser = null;

  updateUIForLoggedOut();
  checkAdminAccess();
  clearAuthFields();

  // 1. Clear the global items array
  if (typeof cartItems !== 'undefined') {
    cartItems = [];
  }

  // 2. Clear the Cart Modal list so the next person doesn't see your games
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  if (cartItemsContainer) {
    cartItemsContainer.innerHTML = '<p class="empty-state">Please login to view your cart</p>';
  }
  if (cartTotal) {
    cartTotal.textContent = '0';
  }

  // 3. Reset the count badge
  const cartCount = document.getElementById('cartCount');
  if (cartCount) {
    cartCount.textContent = '0';
    cartCount.style.display = 'none';
  }

  showNotification('Logged out successfully', 'info');
}

/* --- Updated updateUIForLoggedIn in js/auth.js --- */
function updateUIForLoggedIn(user) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userWallet = document.getElementById('userWallet');

  if (loginBtn) loginBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';

  if (userWallet) {
    const balance = user.wallet || 0;

    // Sana's Visual Fix: Compact numbers for mobile (e.g., ₹1.2k)
    if (window.innerWidth <= 768 && balance >= 100000) {
      userWallet.textContent = `₹${(balance / 1000).toFixed(1)}k`;
    } else {
      userWallet.textContent = `₹${balance.toLocaleString('en-IN')}`;
    }
  }
}

// Update UI for logged out user
function updateUIForLoggedOut() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userWallet = document.getElementById('userWallet');

  if (loginBtn) loginBtn.style.display = 'inline-block';
  if (logoutBtn) logoutBtn.style.display = 'none';
  if (userWallet) userWallet.textContent = '₹0';
}

// Get current user
function getCurrentUser() {
  return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// ✅ MAKE IT GLOBAL: Attach to window so cart.js and games.js can use it
window.showNotification = function(message, type = 'info') {
  // Remove any existing notifications to prevent stacking overload
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Custom Styles to match Ecliptix Theme (Black/Red/Blue)
  const colors = {
      success: '#0074e4', // Ecliptix Blue
      error: '#e94560',   // Red Neon
      info: '#1a1a1a'     // Dark Grey
  };

  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 25px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    z-index: 10000;
    font-weight: 500;
    display: flex;
    align-items: center;
    border-left: 5px solid rgba(255,255,255,0.3);
    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  `;

  // Add keyframe for the nice slide effect if it doesn't exist
  if (!document.getElementById('notify-style')) {
      const style = document.createElement('style');
      style.id = 'notify-style';
      style.innerHTML = `
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.4s ease forwards';
    setTimeout(() => notification.remove(), 400);
  }, 3000);
};



function openLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    // 1. Make it exist
    loginModal.style.display = 'block';
    
    // 2. Animate and Lock Scroll
    requestAnimationFrame(() => {
      loginModal.classList.add('show');
      document.body.classList.add('modal-open'); // LOCK SCROLL
    });
  }
}

function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    // 1. Remove 'show' to trigger the fade-out
    loginModal.classList.remove('show');

    // 2. Wait for the CSS transition (400ms) before hiding it completely
    setTimeout(() => {
      loginModal.style.display = 'none';
      document.body.classList.remove('modal-open');
    }, 400);
  }
}

// Ensure the "X" button and outside-clicks also remove the class
document.addEventListener('click', (e) => {
  const loginModal = document.getElementById('loginModal');
  if (e.target.classList.contains('close') || e.target === loginModal) {
    closeLoginModal();
  }
});
