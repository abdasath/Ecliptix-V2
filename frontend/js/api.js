// API Configuration
const API_BASE_URL = "https://ecliptix-v2.onrender.com";

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

/* --- Updated apiRequest in js/api.js --- */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  // Read the response text ONLY ONCE
  const text = await res.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Server error');
  }

  if (!res.ok) {
    const error = new Error(data.message || 'Server error');
    error.status = res.status;
    throw error;
  }

  return data;
}

window.cartAPI = {
  get: () => apiRequest('/api/cart'),

  add: (gameId) =>
    apiRequest(`/api/cart/add/${gameId}`, {
      method: 'POST'
    }),

  remove: (gameId) =>
    apiRequest(`/api/cart/remove/${gameId}`, {
      method: 'DELETE'
    }),

  clear: () =>
    apiRequest('/api/cart/clear', {
      method: 'DELETE'
    })
};

/* --- Update in js/api.js --- */
window.ordersAPI = {
  // ADD THIS LINE: Fetches all orders for the logged-in user
  getAll: () => 
    apiRequest('/api/orders'),

  checkout: () =>
    apiRequest('/api/orders/checkout', {
      method: 'POST'
    })
};

// ✅ MAKE GLOBAL
window.authAPI = {
  register: (username, email, password) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: { username, email, password }
    }),

  login: (email, password) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  getCurrentUser: () =>
    apiRequest('/api/auth/me')
};


/* --- Updated gamesAPI to use the authenticated helper --- */
window.gamesAPI = {
  // Now uses apiRequest to ensure headers are included if available
  getAll: (query) => 
    apiRequest(`/api/games?${query}`),

  getFeatured: () => 
    apiRequest('/api/games?featured=true'),

  getById: (id) => 
    apiRequest(`/api/games/${id}`)
};


/* --- Update this section in js/api.js --- */
window.walletAPI = {
  addFunds: (amount) =>
    // FIX: Added /orders to the path to match your backend
    apiRequest('/api/orders/wallet/add', { 
      method: 'POST',
      body: { amount: parseFloat(amount) }
    })
};

