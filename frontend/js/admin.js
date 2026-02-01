// Admin Panel Management
let allAdminGames = [];

document.addEventListener('DOMContentLoaded', () => {
  const adminContainer = document.getElementById('adminPanelContainer'); // Ensure your HTML has this ID

  if (!isAuthenticated()) {
    // 1. Immediately hide everything if somehow CSS failed
    if (adminContainer) adminContainer.style.display = 'none';
    document.body.innerHTML = ''; // Blank the entire page
    
    // 2. Alert and Redirect
    alert('Unauthorized Access! Redirecting to home...');
    window.location.href = 'index.html';
    return;
  }

  // If they ARE authenticated, show the content and load data
  if (adminContainer) adminContainer.style.display = 'block';
  loadAdminGames();
  setupGameForm();
  setupLogout();
});

// Load all games for admin
async function loadAdminGames() {
  try {
    const games = await apiRequest('/api/admin/games');
    allAdminGames = games;
    displayAdminGames(games);
  } catch (error) {
    console.error('Failed to load games:', error);
    alert('Failed to load games. Make sure you are authenticated.');
  }
}

// Display games in admin panel
function displayAdminGames(games) {
  const container = document.getElementById('gamesList');
  if (!container) return;

  if (games.length === 0) {
    container.innerHTML = '<p class="empty-state">No games found</p>';
    return;
  }

  container.innerHTML = games.map(game => createAdminGameCard(game)).join('');
}

// Create admin game card
function createAdminGameCard(game) {
  const finalPrice = game.discount > 0
  ? Math.round(game.price * (1 - game.discount / 100)) // Added Math.round here
  : game.price;

  return `
    <div class="game-card">
      <img src="${game.coverImage}" alt="${game.title}" class="game-image">
      <div class="game-info">
        <h3 class="game-title">${game.title}</h3>
        <p class="game-description">${game.shortDescription || game.description.substring(0, 100)}...</p>
        <div class="game-meta">
          <div class="game-price">
            <div class="price-current">₹${finalPrice.toLocaleString('en-IN')}</div>
            ${game.discount > 0 ? `<span class="discount-badge">-${game.discount}%</span>` : ''}
          </div>
        </div>
        <div class="game-actions">
          <button class="btn-secondary" onclick="editGame('${game._id}')">Edit</button>
          <button class="btn-primary" style="background: #e94560;" onclick="deleteGame('${game._id}')">Delete</button>
        </div>
      </div>
    </div>
  `;
}

// Setup game form
function setupGameForm() {
  const form = document.getElementById('gameForm');
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    await handleAddGame();
  };
}

// Handle add game
async function handleAddGame() {
  const form = document.getElementById('gameForm');
  if (!form) return;

  const formData = {
    title: document.getElementById('gameTitle').value,
    shortDescription: document.getElementById('gameShortDesc').value,
    description: document.getElementById('gameDescription').value,
    price: parseFloat(document.getElementById('gamePrice').value),
    originalPrice: parseFloat(document.getElementById('gamePrice').value),
    discount: parseFloat(document.getElementById('gameDiscount').value) || 0,
    coverImage: document.getElementById('gameCoverImage').value,
    images: document.getElementById('gameImages').value
      ? document.getElementById('gameImages').value.split(',').map(url => url.trim())
      : [],
    developer: document.getElementById('gameDeveloper').value,
    publisher: document.getElementById('gamePublisher').value,
    releaseDate: document.getElementById('gameReleaseDate').value,
    genres: document.getElementById('gameGenres').value.split(',').map(g => g.trim()),
    tags: document.getElementById('gameTags').value
      ? document.getElementById('gameTags').value.split(',').map(t => t.trim())
      : [],
    rating: parseFloat(document.getElementById('gameRating').value) || 0,
    featured: document.getElementById('gameFeatured').checked
  };

  // Add system requirements (basic)
  formData.systemRequirements = {
    minimum: {
      os: 'Windows 10/11',
      processor: 'Intel Core i5 (12th gen) / AMD Ryzen 5 (5000-series) or better',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GeForce RTX 3050 / 4050 (or equivalent) with 6 GB VRAM (mobile GPU)',
      storage: '50 GB (SSD preferred; NVMe SSD strongly recommended)'
    },
    recommended: {
      os: 'Windows 11',
      processor: 'Intel Core i7 (13th-14th gen) / AMD Ryzen 7 (7000-series) or better',
      memory: '16–32 GB RAM (DDR5 or high-speed DDR4)',
      graphics: 'NVIDIA GeForce RTX 4060 / 4050 (or better) with ≥8 GB VRAM (mobile GPU)',
      storage: '50 GB on SSD (ideally NVMe SSD, 512 GB+ total storage)'
    },
    ideal: {
      os: 'Windows 11',
      processor: 'Intel Core i7/i9 (latest gen) or AMD Ryzen 9 (latest gen)',
      memory: '32 GB RAM (DDR5)',
      graphics: 'NVIDIA GeForce RTX 4060 Ti / 4070 or AMD RX 7000-series (mobile GPU) with ≥8 GB VRAM',
      storage: '1 TB NVMe SSD'
    }
  };


  try {
    await apiRequest('/api/admin/games', {
      method: 'POST',
      body: formData
    });


    showNotification('Game added successfully!', 'success');
    form.reset();
    await loadAdminGames();
  } catch (error) {
    alert(error.message || 'Failed to add game');
    console.error(error);
  }
}

// Edit game
async function editGame(gameId) {
  const game = allAdminGames.find(g => g._id === gameId);
  if (!game) {
    alert('Game not found');
    return;
  }

  // Populate form with game data
  document.getElementById('gameTitle').value = game.title;
  document.getElementById('gameShortDesc').value = game.shortDescription || '';
  document.getElementById('gameDescription').value = game.description || '';
  document.getElementById('gamePrice').value = game.price;
  document.getElementById('gameDiscount').value = game.discount || 0;
  document.getElementById('gameCoverImage').value = game.coverImage;
  document.getElementById('gameImages').value = game.images?.join(', ') || '';
  document.getElementById('gameDeveloper').value = game.developer;
  document.getElementById('gamePublisher').value = game.publisher;
  document.getElementById('gameReleaseDate').value = new Date(game.releaseDate).toISOString().split('T')[0];
  document.getElementById('gameGenres').value = game.genres?.join(', ') || '';
  document.getElementById('gameTags').value = game.tags?.join(', ') || '';
  document.getElementById('gameRating').value = game.rating || 0;
  document.getElementById('gameFeatured').checked = game.featured || false;

  // Change form submit to update
  const form = document.getElementById('gameForm');
  form.onsubmit = async (e) => {
    e.preventDefault();
    await handleUpdateGame(gameId);
  };

  // Change button text
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Game';

  // Scroll to form
  form.scrollIntoView({ behavior: 'smooth' });
}

// Handle update game
async function handleUpdateGame(gameId) {
  const formData = {
    title: document.getElementById('gameTitle').value,
    shortDescription: document.getElementById('gameShortDesc').value,
    description: document.getElementById('gameDescription').value,
    price: parseFloat(document.getElementById('gamePrice').value),
    originalPrice: parseFloat(document.getElementById('gamePrice').value),
    discount: parseFloat(document.getElementById('gameDiscount').value) || 0,
    coverImage: document.getElementById('gameCoverImage').value,
    images: document.getElementById('gameImages').value
      ? document.getElementById('gameImages').value.split(',').map(url => url.trim())
      : [],
    developer: document.getElementById('gameDeveloper').value,
    publisher: document.getElementById('gamePublisher').value,
    releaseDate: document.getElementById('gameReleaseDate').value,
    genres: document.getElementById('gameGenres').value.split(',').map(g => g.trim()),
    tags: document.getElementById('gameTags').value
      ? document.getElementById('gameTags').value.split(',').map(t => t.trim())
      : [],
    rating: parseFloat(document.getElementById('gameRating').value) || 0,
    featured: document.getElementById('gameFeatured').checked
  };

  try {
    await apiRequest(`/api/admin/games/${gameId}`, {
      method: 'PUT',
      body: formData
    });

    showNotification('Game updated successfully!', 'success');

    // Reset form
    const form = document.getElementById('gameForm');
    form.reset();
    form.onsubmit = async (e) => {
      e.preventDefault();
      await handleAddGame();
    };
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.textContent = 'Add Game';

    await loadAdminGames();
  } catch (error) {
    alert(error.message || 'Failed to update game');
    console.error(error);
  }
}

// Delete game
async function deleteGame(gameId) {
  if (!confirm('Are you sure you want to delete this game?')) {
    return;
  }

  try {
    await apiRequest(`/api/admin/games/${gameId}`, {
      method: 'DELETE'
    });

    showNotification('Game deleted successfully!', 'success');
    await loadAdminGames();
  } catch (error) {
    alert(error.message || 'Failed to delete game');
    console.error(error);
  }
}

// Setup logout
function setupLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof handleLogout === 'function') {
        handleLogout();
      } else {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
      }
    });
  }
}

