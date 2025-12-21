// Games Management
let allGames = [];
let featuredGames = [];
let currentPage = 1;
let totalPages = 1;


// Initialize games on page load
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedGames();
  loadGames();
  setupFilters();
  setupSearch();

});

// Load featured games
async function loadFeaturedGames() {
  try {
    const data = await gamesAPI.getAll("page=1&limit=5");
    featuredGames = data.games || [];
    displayFeaturedGames(featuredGames);
  } catch (error) {
    console.error('Failed to load featured games:', error);
  }
}


// In frontend/games.js, around line 45 (or wherever your fetch call is)

async function loadGames(page = 1) {
  try {
    const genreFilterEl = document.getElementById('genreFilter');
    const sortFilterEl = document.getElementById('sortFilter');
    const searchInputEl = document.getElementById('searchInput');

    const genreFilter = genreFilterEl ? genreFilterEl.value : '';
    const sortFilter = sortFilterEl ? sortFilterEl.value : '';
    const searchQuery = searchInputEl ? searchInputEl.value.trim() : '';

    const queryParams = new URLSearchParams();

    if (genreFilter && genreFilter !== 'All Genres') {
      queryParams.append('genre', genreFilter);
    }

    if (sortFilter) {
      queryParams.append('sort', sortFilter);
    }

    if (searchQuery) {
      queryParams.append('search', searchQuery);
    }

    queryParams.append('page', page);
    queryParams.append('limit', 20);

    const res = await fetch(
      `https://ecliptix-5c00.onrender.com/api/games?${queryParams.toString()}`
    );


    if (!res.ok) {
      throw new Error('Failed to fetch games');
    }

    const data = await res.json();

    // Backend returns { games, page, pages, total }
    const games = data.games || [];
    allGames = games;

    totalPages = data.pages || data.totalPages || 1;
    currentPage = data.page || page;

    displayGames(games);
    displayPagination();
  } catch (error) {
    console.error('Failed to load games:', error);
    displayGames(null); // will show error state
  }
}


/* --- SEARCH FUNCTIONALITY --- */
function applySearch() {
  // Always start from first page when searching
  currentPage = 1;
  loadGames(1);
}

function scrollToGamesSection() {
  const section = document.querySelector('.games-section'); // <section class="games-section"> in index.html
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}



// Load genres for filter

async function loadGenres() {
  try {
    const genres = await gamesAPI.getGenres();
    const genreFilter = document.getElementById('genreFilter');

    if (genreFilter && genreFilter.children.length === 1) {
      genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreFilter.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load genres:', error);
  }
}

// Display featured games
function displayFeaturedGames(games) {
  const container = document.getElementById('featuredGames');
  if (!container) return;

  if (games.length === 0) {
    container.innerHTML = '<p class="empty-state">No featured games available</p>';
    return;
  }

  container.innerHTML = games.map(game => createGameCard(game, true)).join('');
  attachGameCardListeners();
}

// Safer version of displayGames
function displayGames(games) {
  const container = document.getElementById('gamesGrid'); // Make sure this matches your HTML ID (games-grid or gamesGrid)
  if (!container) return;

  // 1. Safety Check: If games is undefined/null, treat it as an empty list
  if (!games || !Array.isArray(games)) {
    console.error("displayGames Error: Data received is not an array:", games);
    container.innerHTML = '<p class="empty-state">Error loading games. Please try again.</p>';
    return;
  }

  // 2. Empty Check
  if (games.length === 0) {
    container.innerHTML = '<p class="empty-state">No games found</p>';
    return;
  }

  // 3. Render
  container.innerHTML = games.map(game => createGameCard(game)).join('');

  // Re-attach event listeners for "Add to Cart" buttons
  if (typeof attachGameCardListeners === 'function') {
    attachGameCardListeners();
  }
}

// Create game card HTML
function createGameCard(game, isFeatured = false) {
  const finalPrice = game.discount > 0
    ? game.price * (1 - game.discount / 100)
    : game.price;

  const discountBadge = game.discount > 0
    ? `<span class="discount-badge">-${game.discount}%</span>`
    : '';

  const priceDisplay = finalPrice === 0
    ? `<div class="price-current" style="color: #00ff88;">FREE</div>`
    : game.discount > 0
      ? `
      <div class="price-current">₹${finalPrice.toLocaleString('en-IN')}</div>
      <div class="price-original">₹${game.price.toLocaleString('en-IN')}</div>
    `
      : `<div class="price-current">₹${finalPrice.toLocaleString('en-IN')}</div>`;

  const genres = game.genres?.slice(0, 2).map(genre =>
    `<span class="genre-tag">${genre}</span>`
  ).join('') || '';

  return `
    <div class="game-card" data-game-id="${game._id}">
      <img src="${game.coverImage}" alt="${game.title}" class="game-image">
      <div class="game-info">
        <h3 class="game-title">${game.title}</h3>
        <p class="game-description">${game.shortDescription || game.description.substring(0, 100)}...</p>
        <div class="game-genres">${genres}</div>
        <div class="game-meta">
          <div class="game-price">
            ${priceDisplay}
            ${discountBadge}
          </div>
          <div class="game-rating">
            ⭐ ${game.rating?.toFixed(1) || '0.0'}
          </div>
        </div>
        <div class="game-actions">
          <button class="btn-primary" onclick="viewGameDetails('${game._id}')">View Details</button>
          <button
  type="button"
  class="btn-secondary"
  onclick="addToCart('${game._id}')"
>
  Add to Cart
</button>

        </div>
      </div>
    </div>
  `;
}

// Attach event listeners to game cards
function attachGameCardListeners() {
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on buttons
      if (e.target.tagName === 'BUTTON') return;

      const gameId = card.dataset.gameId;
      if (gameId) {
        viewGameDetails(gameId);
      }
    });
  });
}

// View game details
async function viewGameDetails(gameId) {
  try {
    const game = await gamesAPI.getById(gameId);
    displayGameDetails(game);
  } catch (error) {
    alert('Failed to load game details');
    console.error(error);
  }
}

// Display game details in modal
function displayGameDetails(game) {
  const modal = document.getElementById('gameModal');
  const container = document.getElementById('gameDetails');

  if (!modal || !container) return;

  const finalPrice = game.discount > 0
    ? game.price * (1 - game.discount / 100)
    : game.price;

  const discountBadge = game.discount > 0
    ? `<span class="discount-badge">-${game.discount}% OFF</span>`
    : '';

  const priceDisplay = finalPrice === 0
    ? `<div class="price-current" style="font-size: 2rem; color: #00ff88;">FREE</div>`
    : game.discount > 0
      ? `
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</span>
        <span class="price-original">₹${game.price.toLocaleString('en-IN')}</span>
        ${discountBadge}
      </div>
    `
      : `<div class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</div>`;

  const genres = game.genres?.map(genre =>
    `<span class="genre-tag">${genre}</span>`
  ).join('') || '';

  const tags = game.tags?.map(tag =>
    `<span class="genre-tag">${tag}</span>`
  ).join('') || '';

  const systemReq = game.systemRequirements ? `
   <div class="system-requirements">
  <h4>System Requirements</h4>

  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2rem;">
    
    <!-- Minimum -->
    <div>
      <h5>Minimum</h5>
      <p><strong>OS:</strong> ${game.systemRequirements.minimum?.os || 'N/A'}</p>
      <p><strong>Processor:</strong> ${game.systemRequirements.minimum?.processor || 'N/A'}</p>
      <p><strong>Memory:</strong> ${game.systemRequirements.minimum?.memory || 'N/A'}</p>
      <p><strong>Graphics:</strong> ${game.systemRequirements.minimum?.graphics || 'N/A'}</p>
      <p><strong>Storage:</strong> ${game.systemRequirements.minimum?.storage || 'N/A'}</p>
    </div>

    <!-- Recommended -->
    <div>
      <h5>Recommended</h5>
      <p><strong>OS:</strong> ${game.systemRequirements.recommended?.os || 'N/A'}</p>
      <p><strong>Processor:</strong> ${game.systemRequirements.recommended?.processor || 'N/A'}</p>
      <p><strong>Memory:</strong> ${game.systemRequirements.recommended?.memory || 'N/A'}</p>
      <p><strong>Graphics:</strong> ${game.systemRequirements.recommended?.graphics || 'N/A'}</p>
      <p><strong>Storage:</strong> ${game.systemRequirements.recommended?.storage || 'N/A'}</p>
    </div>

    <!-- Ideal -->
    <div>
      <h5>Ideal</h5>
      <p><strong>OS:</strong> ${game.systemRequirements.ideal?.os || 'N/A'}</p>
      <p><strong>Processor:</strong> ${game.systemRequirements.ideal?.processor || 'N/A'}</p>
      <p><strong>Memory:</strong> ${game.systemRequirements.ideal?.memory || 'N/A'}</p>
      <p><strong>Graphics:</strong> ${game.systemRequirements.ideal?.graphics || 'N/A'}</p>
      <p><strong>Storage:</strong> ${game.systemRequirements.ideal?.storage || 'N/A'}</p>
    </div>

  </div>
</div>

  ` : '';

  container.innerHTML = `
    <div class="game-details">
      <div class="game-details-header">
        <img src="${game.images[0]}" alt="${game.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem;">
        <h2>${game.title}</h2>
        <div class="game-details-meta">
          <p><strong>Developer:</strong> ${game.developer}</p>
          <p><strong>Publisher:</strong> ${game.publisher}</p>
          <p><strong>Release Date:</strong> ${new Date(game.releaseDate).toLocaleDateString()}</p>
          <div class="game-rating" style="margin-top: 1rem;">
            ⭐ ${game.rating?.toFixed(1) || '0.0'} Rating
          </div>
        </div>
      </div>
      <div class="game-details-content">
        <div class="game-description-full">
          <h3>About</h3>
          <p>${game.description}</p>
        </div>
        <div class="game-genres-tags">
          <h4>Genres</h4>
          <div class="game-genres">${genres}</div>
          ${tags ? `<h4 style="margin-top: 1rem;">Tags</h4><div class="game-genres">${tags}</div>` : ''}
        </div>
        ${systemReq}
        <div class="game-details-actions" style="margin-top: 2rem; display: flex; gap: 1rem;">
          ${priceDisplay}
          <div style="display: flex; gap: 1rem; align-items: center;">
            <button class="btn-primary" onclick="addToCart('${game._id}'); document.getElementById('gameModal').style.display='none';">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = 'block';

  // Close modal
  const closeBtn = modal.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }

  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// Setup filters
function setupFilters() {
  const genreFilter = document.getElementById('genreFilter');
  const sortFilter = document.getElementById('sortFilter');

  if (genreFilter) {
    genreFilter.addEventListener('change', () => {
      currentPage = 1;
      loadGames(1);
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      currentPage = 1;
      loadGames(1);
    });
  }
}

function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      currentPage = 1;
      loadGames(1);          // backend search + pagination
      scrollToGamesSection(); // ⬅️ jump to results
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        currentPage = 1;
        loadGames(1);
        scrollToGamesSection(); // ⬅️ jump to results
      }
    });
  }
}

function displayPagination() {
  const container = document.getElementById('pagination');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `
    <button ${currentPage === 1 ? 'disabled' : ''} 
            onclick="loadGames(${currentPage - 1}); scrollToGamesSection();">
      Previous
    </button>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `
        <button class="${i === currentPage ? 'active' : ''}" 
                onclick="loadGames(${i}); scrollToGamesSection();">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span>...</span>`;
    }
  }

  // Next button
  html += `
    <button ${currentPage === totalPages ? 'disabled' : ''} 
            onclick="loadGames(${currentPage + 1}); scrollToGamesSection();">
      Next
    </button>
  `;

  container.innerHTML = html;
}







