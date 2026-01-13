// Games Management
let allGames = [];
let featuredGames = [];
let currentPage = 1;
let totalPages = 1;

// Load featured games
async function loadFeaturedGames() {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/games/featured/random`
    );

    if (!res.ok) throw new Error('Failed to load featured games');

    const games = await res.json();
    displayFeaturedGames(games);
  } catch (err) {
    console.error(err);
  }
}

/* --- SEARCH FUNCTIONALITY --- */
function applySearch() {
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

// --- LOAD GENRES FOR DROPDOWN ---
async function loadGenres() {
  try {
    // Updated URL to match the backend route
    const res = await fetch(`${API_BASE_URL}/api/games/meta/genres`);

    if (!res.ok) throw new Error('Failed to fetch genres');

    const genres = await res.json();
    const genreFilter = document.getElementById('genreFilter');

    // Reset dropdown
    genreFilter.innerHTML = '<option value="">All Genres</option>';

    // Populate
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre;
      option.textContent = genre;
      genreFilter.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load genres:', error);
  }
}

// --- LOAD GAMES WITH FILTERS ---
async function loadGames(page = 1) {
  try {
    const genreFilter = document.getElementById('genreFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;
    const searchQuery = document.getElementById('searchInput').value.trim();

    // Build URL Params
    const queryParams = new URLSearchParams({
      page: page,
      limit: 20
    });

    if (genreFilter) queryParams.append('genre', genreFilter);
    if (sortFilter) queryParams.append('sort', sortFilter);
    if (searchQuery) queryParams.append('search', searchQuery);

    console.log("Loading games with:", queryParams.toString());

    const res = await fetch(`${API_BASE_URL}/api/games?${queryParams}`);
    const data = await res.json();

    // Update Global Variables
    allGames = data.games || [];
    totalPages = data.totalPages || 1;
    currentPage = data.page || 1; // Note: backend returns 'page', not 'currentPage'

    displayGames(allGames);
    displayPagination();

  } catch (error) {
    console.error('Failed to load games:', error);
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Load Data
  loadFeaturedGames(); // If you have this function
  loadGames();
  loadGenres(); // <--- Important: Call this!
  setupFilters();
  setupSearch();

  // 2. Setup Filter Listeners
  document.getElementById('genreFilter').addEventListener('change', () => loadGames(1));
  document.getElementById('sortFilter').addEventListener('change', () => loadGames(1));

  // 3. Setup Search Listener
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => loadGames(1));
  }
});

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

// 2. Updated attachGameCardListeners: Now safely calls the gatekeeper
function attachGameCardListeners() {
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on buttons
      if (e.target.tagName === 'BUTTON') return;

      const gameId = card.dataset.gameId;
      if (gameId) {
        // This now triggers the scroll reset correctly!
        viewGameDetails(gameId);
      }
    });
  });
}

/* --- Replace viewGameDetails in js/games.js --- */
async function viewGameDetails(gameId) {
  const modal = document.getElementById('gameModal');
  const container = document.getElementById('gameDetails');
  const modalContent = modal.querySelector('.modal-content'); // Get the wrapper too

  if (!modal || !container) return;

  // 1. Hide briefly to ensure a clean state
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');

  try {
    const game = await gamesAPI.getById(gameId); // Ensure this API call works, otherwise use fetch logic

    // 2. RENDER: Generate HTML
    displayGameDetails(game);

    // 3. SHOW: Make visible
    modal.style.display = 'block';
    document.body.classList.add('modal-open');

    // 4. RESET SCROLL (The "Nuclear" Option)
    // We target every possible scrollable element
    modal.scrollTop = 0;
    container.scrollTop = 0;
    if (modalContent) modalContent.scrollTop = 0;

    // 5. FORCE RESET with setTimeout
    // This waits 10ms for the browser to finish 'painting' the modal, 
    // then snaps it to the top again to override browser memory.
    setTimeout(() => {
        modal.scrollTop = 0;
        container.scrollTop = 0;
        if (modalContent) modalContent.scrollTop = 0;
    }, 10);

  } catch (error) {
    console.error('Failed to load game details:', error);
  }
}

// Display game details in modal
function displayGameDetails(game) {
  const container = document.getElementById('gameDetails');
  const modal = document.getElementById('gameModal');
  if (!modal || !container) return;

  // Pricing Logic
  const finalPrice = game.discount > 0
    ? game.price * (1 - game.discount / 100)
    : game.price;

  const discountBadge = game.discount > 0
    ? `<span class="discount-badge">-${game.discount}% OFF</span>`
    : '';

  const priceDisplay = finalPrice === 0
    ? `<div class="price-current" style="font-size: 2rem; color: #00ff88;">FREE</div>`
    : game.discount > 0
      ? `<div style="display: flex; align-items: center; gap: 1rem;">
           <span class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</span>
           <span class="price-original">₹${game.price.toLocaleString('en-IN')}</span>
           ${discountBadge}
         </div>`
      : `<div class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</div>`;

  const genres = game.genres?.map(g => `<span class="genre-tag">${g}</span>`).join('') || '';
  const tags = game.tags?.map(t => `<span class="genre-tag">${t}</span>`).join('') || '';

  // Generate System Requirements HTML
  const systemReq = game.systemRequirements ? `
   <div class="system-requirements">
      <h4>System Requirements</h4>
      <div class="req-grid" style="display: grid; gap: 2rem;">
        <div>
          <h5>Minimum</h5>
          <p><strong>OS:</strong> ${game.systemRequirements.minimum?.os || 'N/A'}</p>
          <p><strong>Processor:</strong> ${game.systemRequirements.minimum?.processor || 'N/A'}</p>
          <p><strong>Memory:</strong> ${game.systemRequirements.minimum?.memory || 'N/A'}</p>
          <p><strong>Graphics:</strong> ${game.systemRequirements.minimum?.graphics || 'N/A'}</p>
          <p><strong>Storage:</strong> ${game.systemRequirements.minimum?.storage || 'N/A'}</p>
        </div>
        <div>
          <h5>Recommended</h5>
          <p><strong>OS:</strong> ${game.systemRequirements.recommended?.os || 'N/A'}</p>
          <p><strong>Processor:</strong> ${game.systemRequirements.recommended?.processor || 'N/A'}</p>
          <p><strong>Memory:</strong> ${game.systemRequirements.recommended?.memory || 'N/A'}</p>
          <p><strong>Graphics:</strong> ${game.systemRequirements.recommended?.graphics || 'N/A'}</p>
          <p><strong>Storage:</strong> ${game.systemRequirements.recommended?.storage || 'N/A'}</p>
        </div>
      </div>
   </div>` : '';

  // Inject HTML
  container.innerHTML = `
    <div class="game-details">
      <div class="game-details-header">
        <img src="${game.images[0]}" alt="${game.title}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem;">
        <h2>${game.title}</h2>
        <div class="game-details-meta">
          <p><strong>Developer:</strong> ${game.developer}</p>
          <p><strong>Publisher:</strong> ${game.publisher}</p>
          <p><strong>Release Date:</strong> ${new Date(game.releaseDate).toLocaleDateString()}</p>
          <div class="game-rating" style="margin-top: 1rem;">⭐ ${game.rating?.toFixed(1) || '0.0'} Rating</div>
        </div>
      </div>
      <div class="game-details-content">
        <div class="game-description-full">
  <h3>About</h3>
  ${
    (game.description || '')
      .split(/\n\s*\n/)   // split by empty line
      .map(paragraph => `<p>${paragraph.trim()}</p>`)
      .join('')
  }
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
            <button class="btn-primary" onclick="addToCart('${game._id}'); document.getElementById('gameModal').style.display='none'; document.body.classList.remove('modal-open');">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  `;

  

  // Re-attach Close Event Listener (Best practice is to do this here or once globally)
  const closeBtn = modal.querySelector('.close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
    };
  }

  // Click outside to close
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
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
      scrollToGamesSection();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', () => {
      currentPage = 1;

      // FORCE reload even if same option is selected again
      loadGames(1);

      scrollToGamesSection();
    });
  }

}


function setupSearch() {
  const searchInput = document.getElementById('searchInput');

  if (!searchInput) return;

  let searchTimeout;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
      currentPage = 1;
      loadGames(1);              // 🔥 backend search
      scrollToGamesSection();    // smooth UX
    }, 400); // debounce like Steam
  });
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







