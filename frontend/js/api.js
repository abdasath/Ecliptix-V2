// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get auth token
function getAuthToken() {
  return localStorage.getItem('token');
}

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    },
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  register: (username, email, password) => 
    apiRequest('/auth/register', {
      method: 'POST',
      body: { username, email, password }
    }),

  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    }),

  getCurrentUser: () =>
    apiRequest('/auth/me')
};

// Games API
const gamesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/games?${queryString}`);
  },

  getById: (id) =>
    apiRequest(`/games/${id}`),

  getFeatured: () =>
    apiRequest('/games/featured/list'),

  getGenres: () =>
    apiRequest('/games/meta/genres')
};

// Cart API
const cartAPI = {
  get: () =>
    apiRequest('/cart'),

  add: (gameId) =>
    apiRequest(`/cart/add/${gameId}`, {
      method: 'POST'
    }),

  remove: (gameId) =>
    apiRequest(`/cart/remove/${gameId}`, {
      method: 'DELETE'
    }),

  clear: () =>
    apiRequest('/cart/clear', {
      method: 'DELETE'
    })
};

// Orders API
const ordersAPI = {
  getAll: () =>
    apiRequest('/orders'),

  checkout: () =>
    apiRequest('/orders/checkout', {
      method: 'POST'
    }),

  addFunds: (amount) =>
    apiRequest('/orders/wallet/add', {
      method: 'POST',
      body: { amount }
    })
};

