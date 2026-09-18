/**
 * ai-search.js — Ecliptix AI Game Advisor (Conversational Chat Widget)
 *
 * Full chat-style UI: user bubbles + AI bubbles, continuous conversation
 * history within the same session, auto-scroll, and proper input clearing.
 */

// XSS-safe markdown for AI responses: HTML is fully escaped FIRST, then only
// the allowed formatting is applied (bold, italics, line breaks). Arbitrary
// HTML from an LLM response can therefore never execute in the page.
function formatAIMarkdown(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
window.formatAIMarkdown = formatAIMarkdown;

(function () {
  'use strict';

  let fab, panel, closeBtn, input, sendBtn;
  let chatBody, welcomeEl, chipsEl, messagesEl;
  let isOpen = false;
  let hasStartedChat = false; // tracks whether welcome/chips should be hidden

  window.resetAIChat = function() {
    if (messagesEl) messagesEl.innerHTML = '';
    if (welcomeEl) {
      welcomeEl.classList.remove('ai-hidden');
      welcomeEl.style.cssText = '';
    }
    if (chipsEl) {
      chipsEl.classList.remove('ai-hidden');
      chipsEl.style.cssText = '';
    }
    hasStartedChat = false;
  };



  // Automatically clear chat if auth state changes (login/logout)
  window.addEventListener('auth-changed', () => {
    if (typeof window.resetAIChat === 'function') {
      window.resetAIChat();
    }
  });

  // ── Toggle panel ──────────────────────────────────────────────
  function openPanel() {
    // 1. Close side navbar on mobile if it's open
    if (window.innerWidth <= 768) {
      const navMenu = document.querySelector('.nav-menu');
      const menuBtn = document.querySelector('.menu-toggle');
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        if (menuBtn) menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    }

    isOpen = true;
    panel.classList.add('active');
    fab.classList.add('active');
    setTimeout(() => input && input.focus(), 350);
    scrollToBottom();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove('active');
    fab.classList.remove('active');
  }

  // ── Scroll chat body to bottom ────────────────────────────────
  function scrollToBottom() {
    if (chatBody) {
      requestAnimationFrame(() => {
        chatBody.scrollTop = chatBody.scrollHeight;
      });
    }
  }

  // ── Scroll to specific element ───────────────────────────────
  function scrollToElement(el) {
    if (el) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  // ── Hide welcome and chips after first message ────────────────
  function hideWelcome() {
    if (!hasStartedChat) {
      hasStartedChat = true;
      if (welcomeEl) {
        welcomeEl.classList.add('ai-hidden');
        setTimeout(() => welcomeEl.style.display = 'none', 300);
      }
      if (chipsEl) {
        chipsEl.classList.add('ai-hidden');
        setTimeout(() => chipsEl.style.display = 'none', 300);
      }
    }
  }

  // ── Add a user message bubble ─────────────────────────────────
  function addUserBubble(text) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg ai-msg-user';
    wrapper.innerHTML = `<div class="ai-bubble-user">${escapeHTML(text)}</div>`;
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  // ── Add a typing indicator ────────────────────────────────────
  function addTypingIndicator() {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg ai-msg-bot ai-typing-indicator';
    wrapper.innerHTML = `
      <div class="ai-bubble-avatar"><i class='bx bx-bot'></i></div>
      <div class="ai-bubble-text ai-typing-content">
        <div class="ai-typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    messagesEl.appendChild(wrapper);
    scrollToBottom();
    return wrapper;
  }

  // ── Remove typing indicator ───────────────────────────────────
  function removeTypingIndicator() {
    const indicator = messagesEl.querySelector('.ai-typing-indicator');
    if (indicator) indicator.remove();
  }

  // ── Add an AI response bubble ─────────────────────────────────
  function addBotBubble(htmlContent) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-msg ai-msg-bot';
    wrapper.innerHTML = `
      <div class="ai-bubble-avatar"><i class='bx bx-bot'></i></div>
      <div class="ai-bubble-text">${htmlContent}</div>`;
    messagesEl.appendChild(wrapper);
    return wrapper;
  }

  // ── Add game cards grid ───────────────────────────────────────
  function addGameCards(games) {
    if (!games || games.length === 0) return null;
    const grid = document.createElement('div');
    grid.className = 'ai-results-grid';
    games.forEach(g => grid.appendChild(renderCard(g)));
    messagesEl.appendChild(grid);
    return grid;
  }

  // ── Navigate to Store Game ─────────────────────────────────────
  function navigateToGame(gameTitle) {
    const searchInput = document.getElementById('searchInput');
    const gamesGrid = document.getElementById('gamesGrid');
    // Close the AI panel so the user can immediately see the store results
    closePanel();

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
        <img src="${escapeHTML(game.coverImage)}" alt="${escapeHTML(game.title)}" loading="lazy" onerror="this.src='images/placeholder.jpg'">
        ${game.discount > 0 ? `<span class="ai-badge-discount">-${escapeHTML(game.discount)}%</span>` : ''}
      </div>
      <div class="ai-game-info">
        <p class="ai-game-title">${escapeHTML(game.title)}</p>
        <p class="ai-game-genre">${escapeHTML(genres)}</p>
        <p class="ai-game-rating">${stars}</p>
        <div class="ai-game-price">${finalPrice}</div>
      </div>`;
    return card;
  }

  // ── Main search / send message ────────────────────────────────
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
      hideWelcome();
      addUserBubble(query);
      input.value = '';
      addBotBubble('<em>Please log in to use the Ecliptix AI Assistant.</em>');
      
      // Automatically pop open the login modal
      const loginBtn = document.getElementById('loginBtn');
      if (loginBtn) {
        setTimeout(() => loginBtn.click(), 800);
      }
      return;
    }

    // 1. Hide welcome, show user bubble, clear input
    hideWelcome();
    const userMsgWrapper = addUserBubble(query);
    input.value = '';

    // 2. Show typing indicator & disable send
    const typingEl = addTypingIndicator();
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i>';

    try {
      const res  = await fetch(`${window.API_BASE_URL || API_BASE_URL}/api/rag/search?q=${encodeURIComponent(query)}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Search failed');

      // 3. Remove typing, add AI bubble only if there's text
      removeTypingIndicator();
      const aiText = (data.aiResponse || '').trim();
      
      if (aiText) {
        addBotBubble(formatAIMarkdown(aiText));
      }

      // 4. Show game cards for recommendation/comparison
      if (['recommendation', 'comparison'].includes(data.type)) {
        addGameCards(data.games);
      }
      
      // Smoothly scroll to the top of the USER'S question so the whole context is visible
      if (userMsgWrapper) {
        scrollToElement(userMsgWrapper);
      }

    } catch (err) {
      removeTypingIndicator();
      addBotBubble(`⚠️ ${escapeHTML(err.message || 'Something went wrong. Try again.')}`);
    } finally {
      sendBtn.disabled = false;
      sendBtn.innerHTML = '<i class="bx bx-send"></i>';
    }
  }

  // ── Init ──────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    fab         = document.getElementById('aiFab');
    panel       = document.getElementById('aiChatPanel');
    closeBtn    = document.getElementById('aiChatClose');
    input       = document.getElementById('aiSearchInput');
    sendBtn     = document.getElementById('aiSearchBtn');
    chatBody    = document.getElementById('aiChatBody');
    welcomeEl   = document.getElementById('aiWelcome');
    chipsEl     = document.getElementById('aiChips');
    messagesEl  = document.getElementById('aiMessages');

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
