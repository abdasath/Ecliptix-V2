// Admin Panel Management
let allAdminGames = [];

// XSS guard: escape DB-provided game fields before injecting into innerHTML


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
  setupAdminTabs(); // Initialize the bubble tabs
  loadAdminGames();
  setupGameForm();
  setupLogout();

  // Bind Add Game Button safely
  const btnOpenAddGame = document.getElementById('btnOpenAddGame');
  if (btnOpenAddGame) {
    btnOpenAddGame.addEventListener('click', (e) => {
      e.preventDefault();
      openAddGameModal(false);
    });
  }

  setupAdminSearch();
});

// Setup instant local search for admin panel
function setupAdminSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      displayAdminGames(allAdminGames);
      return;
    }

    const filteredGames = allAdminGames.filter(game => 
      game.title.toLowerCase().includes(query) || 
      game.developer.toLowerCase().includes(query)
    );
    displayAdminGames(filteredGames);
  });
}

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

let currentAdminTab = 'all';

function setupAdminTabs() {
  const tabAll = document.getElementById('tabAllGames');
  const tabFeatured = document.getElementById('tabFeaturedGames');

  if (!tabAll || !tabFeatured) return;

  const setActiveTab = (tab) => {
    currentAdminTab = tab;
    if (tab === 'all') {
      tabAll.className = 'btn-primary';
      tabAll.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.2)';
      tabFeatured.className = 'btn-secondary';
      tabFeatured.style.boxShadow = 'none';
    } else {
      tabFeatured.className = 'btn-primary';
      tabFeatured.style.boxShadow = '0 4px 15px rgba(0, 255, 136, 0.2)';
      tabAll.className = 'btn-secondary';
      tabAll.style.boxShadow = 'none';
    }
    displayAdminGames(allAdminGames); // re-render based on new tab
  };

  tabAll.addEventListener('click', () => setActiveTab('all'));
  tabFeatured.addEventListener('click', () => setActiveTab('featured'));
}

// Display games in admin panel
function displayAdminGames(games) {
  const container = document.getElementById('gamesList');
  if (!container) return;

  let gamesToShow = games;
  
  if (currentAdminTab === 'featured') {
    gamesToShow = games.filter(g => g.featured);
    if (gamesToShow.length === 0) {
      container.innerHTML = '<p class="empty-state">No featured games currently set. Edit a game to feature it.</p>';
      return;
    }
  }

  if (gamesToShow.length === 0) {
    container.innerHTML = '<p class="empty-state">No games found in catalog.</p>';
    return;
  }

  container.innerHTML = gamesToShow.map(game => createAdminGameCard(game, currentAdminTab === 'featured')).join('');
}

// Create admin game card
function createAdminGameCard(game, isFeaturedList = false) {
  const finalPrice = game.discount > 0
  ? Math.round(game.price * (1 - game.discount / 100))
  : game.price;

  // If we're displaying in the "All Games" list, and the game is featured, show a badge
  const featuredBadge = (game.featured && !isFeaturedList) 
    ? `<div style="position: absolute; top: 10px; right: 10px; background: #e94560; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: bold; z-index: 10; box-shadow: 0 2px 10px rgba(233, 69, 96, 0.5);">FEATURED</div>` 
    : '';

  return `
    <div class="game-card admin-game-card" style="position: relative; border: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.4);">
      ${featuredBadge}
      <img src="${escapeHTML(game.coverImage)}" alt="${escapeHTML(game.title)}" class="game-image" style="height: 160px; object-fit: cover;">
      <div class="game-info" style="padding: 16px;">
        <h3 class="game-title" style="font-size: 1.1rem; margin-bottom: 8px;">${escapeHTML(game.title)}</h3>
        <p class="game-description" style="font-size: 0.85rem; color: #aaa; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHTML(game.shortDescription || (game.description || '').substring(0, 100))}...</p>
        <div class="game-meta" style="margin-bottom: 16px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
          <div class="game-price" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <div class="price-current" style="font-size: 1.2rem; font-weight: bold; color: #00ff88;">₹${finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            ${game.discount > 0 ? `<span class="discount-badge" style="background: rgba(0, 255, 136, 0.2); color: #00ff88; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">-${escapeHTML(game.discount)}%</span>` : ''}
          </div>
        </div>
        <div class="game-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="btn-secondary" style="padding: 8px; font-size: 0.9rem;" onclick="editGame('${escapeHTML(game._id)}')"><i class='bx bx-edit'></i> Edit</button>
          <button class="btn-primary" style="background: rgba(233, 69, 96, 0.1); color: #e94560; border: 1px solid rgba(233, 69, 96, 0.3); padding: 8px; font-size: 0.9rem;" onclick="deleteGame('${escapeHTML(game._id)}')"><i class='bx bx-trash'></i> Delete</button>
        </div>
      </div>
    </div>
  `;
}


// Open the Add/Edit Game Modal
function openAddGameModal(isEdit = false) {
    try {
        const modal = document.getElementById('adminFormModal');
        if (!modal) throw new Error("adminFormModal not found");
        
        // Show modal with animation
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
            document.body.classList.add('modal-open');
        }, 10);
        
        const form = document.getElementById('gameForm');
        if (!form) throw new Error("gameForm not found");
        
        if (!isEdit) {
            form.reset();
            document.getElementById('adminModalTitle').innerText = 'Add New Game';
            form.querySelector('button[type="submit"]').innerText = 'Add Game';
            form.onsubmit = async (e) => {
                e.preventDefault();
                await handleAddGame();
            };
        }
    } catch(err) {
        console.error("Error opening modal:", err);
    }
}

function closeAddGameModal() {
    const modal = document.getElementById('adminFormModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 400); // match css transition
    }
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
    closeAddGameModal();
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

  document.getElementById('adminModalTitle').innerText = 'Edit Game';
  openAddGameModal(true);

  // Change button text
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Game';

  
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
    closeAddGameModal();

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



document.addEventListener('click', (e) => {
    const target = e.target.closest('#btnOpenAddGame');
    if (target) {
        e.preventDefault();
        console.log("Fallback click caught!");
        openAddGameModal(false);
    }
});
