/**
 * ai-search.js — Ecliptix AI Game Finder (Floating Chat Widget)
 */
(function () {
  'use strict';

  let fab, panel, closeBtn, input, sendBtn, loadingEl, responseEl, responseText, resultsEl;
  let isOpen = false;

  // ── Toggle panel ──────────────────────────────────────────────
  function openPanel() {
    isOpen = true;
    panel.classList.add('active');
    fab.querySelector('.ai-fab-open').style.display = 'none';
    fab.querySelector('.ai-fab-close').style.display = 'flex';
    setTimeout(() => input && input.focus(), 350);
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('active');
    fab.querySelector('.ai-fab-open').style.display = 'flex';
    fab.querySelector('.ai-fab-close').style.display = 'none';
  }

  // ── Loading state ─────────────────────────────────────────────
  function setLoading(on) {
    loadingEl.style.display  = on ? 'flex' : 'none';
    sendBtn.disabled = on;
    sendBtn.innerHTML = on
      ? '<i class="bx bx-loader-alt bx-spin"></i>'
      : '<i class="bx bx-send"></i>';
  }

  // ── Navigate to Store Game ─────────────────────────────────────
  function navigateToGame(gameTitle) {
    const searchInput = document.getElementById('searchInput');
    const gamesGrid = document.getElementById('gamesGrid');

    if (!searchInput) {
      window.location.href = `/?search=${encodeURIComponent(gameTitle)}`;
      return;
    }

    searchInput.value = gameTitle;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    if (gamesGrid) {
      const topOffset = gamesGrid.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  }

  // ── Render a game card ────────────────────────────────────────
  function renderCard(game) {
    const finalPrice = game.discount > 0
      ? `<span class="ai-price-original">₹${game.price.toLocaleString('en-IN')}</span><span class="ai-price-final">₹${Math.round(game.price * (1 - game.discount / 100)).toLocaleString('en-IN')}</span>`
      : `<span class="ai-price-final">₹${game.price.toLocaleString('en-IN')}</span>`;

    const genres = (game.genres || []).slice(0, 2).join(' · ');
    const stars  = '★'.repeat(Math.round(game.rating || 0)) + '☆'.repeat(5 - Math.round(game.rating || 0));

    const card = document.createElement('div');
    card.className = 'ai-game-card';
    card.style.cursor = 'pointer';
    card.title = 'Click to view in store';
    card.addEventListener('click', () => navigateToGame(game.title));
    
    card.innerHTML = `
      <div class="ai-game-cover">
        <img src="${game.coverImage}" alt="${game.title}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        ${game.discount > 0 ? `<span class="ai-badge-discount">-${game.discount}%</span>` : ''}
      </div>
      <div class="ai-game-info">
        <p class="ai-game-title">${game.title}</p>
        <p class="ai-game-genre">${genres}</p>
        <p class="ai-game-rating">${stars}</p>
        <div class="ai-game-price">${finalPrice}</div>
      </div>`;
    return card;
  }

  // ── Main search ───────────────────────────────────────────────
  async function doSearch() {
    const query = input.value.trim();
    if (!query || query.length < 2) {
      input.style.borderColor = '#ef4444';
      setTimeout(() => input.style.borderColor = '', 1500);
      return;
    }

    // Auth Check: Prevent search if not logged in
    const token = localStorage.getItem('token');
    if (!token) {
      responseText.innerHTML = '<em>Please log in to use the Ecliptix AI Assistant.</em>';
      responseEl.style.display = 'flex';
      resultsEl.innerHTML = '';
      
      // Automatically pop open the login modal
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        setTimeout(() => loginBtn.click(), 800);
      }
      return;
    }

    // Clear previous results
    resultsEl.innerHTML = '';
    responseEl.style.display  = 'none';
    responseText.textContent  = '';
    setLoading(true);

    try {
      const res  = await fetch(`${window.API_BASE_URL || API_BASE_URL}/api/rag/search?q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');

      // Show AI bubble
      // Basic markdown parser for bold and newlines
      let formattedText = (data.aiResponse || '')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>');
      responseText.innerHTML = formattedText;
      responseEl.style.display = 'flex';

      // Show game cards
      // Only render cards for recommendations or comparisons
      if (['recommendation', 'comparison'].includes(data.type)) {
        if (data.games && data.games.length > 0) {
          data.games.forEach(g => resultsEl.appendChild(renderCard(g)));
        }
      }

      // Scroll to response
      setTimeout(() => responseEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);

    } catch (err) {
      responseText.textContent = `⚠️ ${err.message || 'Something went wrong. Try again.'}`;
      responseEl.style.display = 'flex';
    } finally {
      setLoading(false);
    }
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    fab         = document.getElementById('aiFab');
    panel       = document.getElementById('aiChatPanel');
    closeBtn    = document.getElementById('aiChatClose');
    input       = document.getElementById('aiSearchInput');
    sendBtn     = document.getElementById('aiSearchBtn');
    loadingEl   = document.getElementById('aiSearchLoading');
    responseEl  = document.getElementById('aiSearchResponse');
    responseText = document.getElementById('aiResponseText');
    resultsEl   = document.getElementById('aiSearchResults');

    if (!fab || !panel) return;

    // FAB toggle
    fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());

    // Close button
    closeBtn.addEventListener('click', closePanel);

    // Send button
    sendBtn.addEventListener('click', doSearch);

    // Enter key
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

    // Suggestion chips
    document.querySelectorAll('.ai-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.textContent;
        doSearch();
      });
    });

    // Escape to close
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) closePanel();
    });
  });

})();
