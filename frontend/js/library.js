// Library Management
let ownedGames = [];

// XSS guard: escape DB-provided game fields before injecting into innerHTML


// Initialize library on page load
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    loadLibrary();
  } else {
    showLoginPrompt();
  }
});

// Re-render when auth changes globally (e.g. login from modal)
window.addEventListener('auth-changed', () => {
  if (isAuthenticated()) {
    loadLibrary();
  } else {
    showLoginPrompt();
  }
});

// Load user's library
async function loadLibrary() {
  if (!isAuthenticated()) {
    showLoginPrompt();
    return;
  }

  try {
    const user = await authAPI.getCurrentUser();
    ownedGames = user.ownedGames || [];
    displayLibraryGames(ownedGames);
  } catch (error) {
    console.error('Failed to load library:', error);
    showLoginPrompt();
  }
}

// Display library games
function displayLibraryGames(games) {
  const container = document.getElementById('libraryGames');
  const emptyState = document.getElementById('emptyLibrary');

  if (!container) return;

  if (games.length === 0) {
    if (container) container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (container) container.style.display = 'grid';
  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = games.map(game => createLibraryGameCard(game)).join('');
}

// Create library game card
function createLibraryGameCard(game) {
  return `
    <div class="game-card" onclick="viewGameDetails('${escapeHTML(game._id)}')">
      <img src="${escapeHTML(game.coverImage)}" alt="${escapeHTML(game.title)}" class="game-image">
      <div class="game-info">
        <h3 class="game-title">${escapeHTML(game.title)}</h3>
        <div class="game-actions">
          <button class="btn-primary" onclick="event.stopPropagation(); viewGameDetails('${escapeHTML(game._id)}')">Play</button>
        </div>
      </div>
    </div>
  `;
}

// Show login prompt
function showLoginPrompt() {
  window.location.replace('index.html');
}

