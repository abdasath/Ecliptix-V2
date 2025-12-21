// Authentication Management
let currentUser = null;

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupAuthModals();
});

// Check if user is logged in
async function checkAuthStatus() {
  const token = localStorage.getItem('token');

  if (!token) {
    // Not logged in at all
    currentUser = null;
    localStorage.removeItem('userInfo');   // 🔹 make sure stale userInfo is gone
    updateUIForLoggedOut();
    checkAdminAccess();                    // 🔹 hide Admin link
    return;
  }

  try {
    const user = await authAPI.getCurrentUser();
    currentUser = user;
    updateUIForLoggedIn(user);

    // Optional: keep userInfo in sync with latest data
    localStorage.setItem('userInfo', JSON.stringify(user));

    checkAdminAccess();                    // 🔹 show/hide Admin correctly
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');   // 🔹 VERY important
    currentUser = null;
    updateUIForLoggedOut();
    checkAdminAccess();                    // 🔹 hide Admin link
  }
}


function checkAdminAccess() {
    // 1. Get user from local storage
    const userString = localStorage.getItem('userInfo'); // Or whatever key you use to save user
    
    // 2. Get the Admin Link element from HTML
    const adminLink = document.querySelector('a[href="admin.html"]'); // Adjust selector to match your HTML
    // OR if it's a list item:
    // const adminLink = document.getElementById('admin-nav-item');

    if (!adminLink) return; // Exit if link doesn't exist on this page

    if (userString) {
        const user = JSON.parse(userString);
        
        // 3. Check if role is admin
        if (user.role === 'admin') {
            adminLink.style.display = 'block'; // Show it
        } else {
            adminLink.style.display = 'none';  // Hide it
        }
    } else {
        // Not logged in? Hide it.
        adminLink.style.display = 'none';
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

// Handle login
async function handleLogin() {
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  if (!email || !password) {
    alert('Please enter email and password');
    return;
  }

  try {
    const response = await authAPI.login(email, password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('userInfo', JSON.stringify(response.user));
    currentUser = response.user;
    updateUIForLoggedIn(response.user);

    checkAdminAccess();

    closeLoginModal();
    
    // const loginModal = document.getElementById('loginModal');
    // if (loginModal) loginModal.style.display = 'none';
    
    // Clear form
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    document.getElementById('username').value = '';

    // Reload page data
    if (typeof loadGames === 'function') loadGames();
    if (typeof loadCart === 'function') loadCart();
    if (typeof loadLibrary === 'function') loadLibrary();
    if (typeof loadProfile === 'function') loadProfile();

    showNotification('Login successful!', 'success');
  } catch (error) {
    alert(error.message || 'Login failed');
  }
}

// Handle register
async function handleRegister() {
  const username = document.getElementById('username')?.value;
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  if (!username || !email || !password) {
    alert('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await authAPI.register(username, email, password);
    localStorage.setItem('token', response.token);

    localStorage.setItem('userInfo', JSON.stringify(response.user));
    checkAdminAccess();

    currentUser = response.user;
    updateUIForLoggedIn(response.user);

    checkAdminAccess();
    
    // const loginModal = document.getElementById('loginModal');
    // if (loginModal) loginModal.style.display = 'none';

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

// Handle logout
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');

  currentUser = null;
  updateUIForLoggedOut();

  checkAdminAccess();
  // 2. ADD THIS: Force the admin button to hide immediately
  const adminLink = document.querySelector('a[href="admin.html"]'); // Adjust selector if needed
  if (adminLink) adminLink.style.display = 'none';

  showNotification('Logged out successfully', 'info');
  
  // Reload page
  if (window.location.pathname.includes('library.html') || 
      window.location.pathname.includes('profile.html')) {
    window.location.href = 'index.html';
  }
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
