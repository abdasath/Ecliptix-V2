// API Configuration
const API_BASE_URL = "https://ecliptix-5c00.onrender.com";

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Helper function to make API requests
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

  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    console.error('Non-JSON response:', text);
    throw new Error('Server error');
  }
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

window.ordersAPI = {
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


window.gamesAPI = {
  getAll: (query) =>
    fetch(`${API_BASE_URL}/api/games?${query}`).then(res => res.json()),

  getFeatured: () =>
    fetch(`${API_BASE_URL}/api/games?featured=true`).then(res => res.json()),

  getById: (id) =>
    fetch(`${API_BASE_URL}/api/games/${id}`).then(res => res.json())
};




