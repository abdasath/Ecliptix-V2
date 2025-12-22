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

// Unified Handle Register Function
async function handleRegister() {
  const username = document.getElementById('username')?.value;
  const emailInput = document.getElementById('email');
  const password = document.getElementById('password')?.value;

  // 1. Trigger browser's built-in validation (bubbles)
  if (emailInput && !emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  const email = emailInput?.value;

  // 2. Manual empty field check
  if (!username || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  // 3. Regex check for extra security
  if (!isValidEmail(email)) {
    alert('Please enter a valid email address (e.g., name@example.com)');
    return;
  }

  // 4. Password length check
  if (password.length < 6) {
    alert('Password must be at least 6 characters');
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
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('username').value = '';

    showNotification('Registration successful!', 'success');
  } catch (error) {
    alert(error.message || 'Registration failed');
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
  const loginSubmit = document.getElementById('loginSubmit');
  const registerSubmit = document.getElementById('registerSubmit');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'block';
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (loginModal) loginModal.style.display = 'none';
    });
  }

  if (loginModal) {
    window.addEventListener('click', (e) => {
      if (e.target === loginModal) {
        loginModal.style.display = 'none';
      }
    });
  }

  if (loginSubmit) {
    loginSubmit.addEventListener('click', handleLogin);
  }

  if (registerSubmit) {
    registerSubmit.addEventListener('click', handleRegister);
  }
}


/* --- Updated handleLogin in auth.js --- */
async function handleLogin() {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  if (emailInput && !emailInput.checkValidity()) {
    emailInput.reportValidity();
    return;
  }

  const email = emailInput?.value;
  const password = passwordInput?.value;

  try {
    const response = await authAPI.login(email, password);
    if (response && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('userInfo', JSON.stringify(response.user));
        currentUser = response.user;

        updateUIForLoggedIn(response.user);
        checkAdminAccess();
        closeLoginModal();
        
        // Sana's Fix: Immediately fetch this specific user's cart
        if (typeof loadCart === 'function') {
            await loadCart(); 
        }

        showNotification('Login successful!', 'success');
    }
   } catch (error) {
    console.error('Login Error:', error);
    // If account doesn't exist, the backend sends 401
    if (error.status === 401) {
        alert('Account not found. Please register first!');
    } else {
        alert(error.message || 'Login failed');
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

// Update UI for logged in user
function updateUIForLoggedIn(user) {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userWallet = document.getElementById('userWallet');

  if (loginBtn) loginBtn.style.display = 'none';
  if (logoutBtn) logoutBtn.style.display = 'inline-block';
  if (userWallet) {
    userWallet.textContent = `₹${(user.wallet || 0).toLocaleString('en-IN')}`;
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

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#e94560' : '#0f3460'};
    color: white;
    border-radius: 5px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Function that opens the login modal
function openLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.style.display = 'block';
    
    // Trigger the background blur for mobile
    if (window.innerWidth <= 768) {
      document.body.classList.add('modal-open');
    }
  }
}

// Function that closes the login modal
function closeLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.style.display = 'none';
    
    // Restore the background
    document.body.classList.remove('modal-open');
  }
}

// Ensure the "X" button and outside-clicks also remove the class
document.addEventListener('click', (e) => {
  const loginModal = document.getElementById('loginModal');
  if (e.target.classList.contains('close') || e.target === loginModal) {
    closeLoginModal();
  }
});
