// Games Management
let allGames = [];
let featuredGames = [];
let currentPage = 1;
let totalPages = 1;

// XSS guard: escape untrusted DB fields before injecting them into HTML


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
  const section = document.querySelector('.games-section');
  if (section) {
    const navbar = document.querySelector('.navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 85;
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;
    
    window.scrollTo({
      top: sectionTop - navbarHeight - 20, // 20px extra breathing room
      behavior: 'smooth'
    });
  }
}

// --- LOAD GENRES FOR DROPDOWN ---
async function loadGenres() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/games/meta/genres`);
    if (!res.ok) throw new Error('Failed to fetch genres');

    const genres = await res.json();
    const genreDropdownList = document.getElementById('genreDropdownList');
    if (!genreDropdownList) return;

    // Reset dropdown
    genreDropdownList.innerHTML = '<li class="dropdown-item" data-value="">All Genres</li>';

    // Populate
    genres.forEach(genre => {
      const li = document.createElement('li');
      li.className = 'dropdown-item';
      li.dataset.value = genre;
      li.textContent = genre;
      genreDropdownList.appendChild(li);
    });
    
    // Setup Custom Dropdown interactions
    const btn = document.getElementById('genreDropdownBtn');
    const text = document.getElementById('genreSelectedText');
    const input = document.getElementById('genreFilter');
    
    if (btn && genreDropdownList && input) {
        // Toggle dropdown
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isShowing = genreDropdownList.style.display === 'block';
            genreDropdownList.style.display = isShowing ? 'none' : 'block';
        });

        // Close when clicking outside
        document.addEventListener('click', () => {
            genreDropdownList.style.display = 'none';
        });

        // Select an item
        genreDropdownList.addEventListener('click', (e) => {
            if (e.target.classList.contains('dropdown-item')) {
                const value = e.target.dataset.value;
                const label = e.target.textContent;
                input.value = value;
                text.textContent = label;
                genreDropdownList.style.display = 'none';
                
                // Trigger change event to load games
                input.dispatchEvent(new Event('change'));
            }
        });
    }

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
  loadFeaturedGames(); 
  
  // Parse URL for genre parameter and set filter automatically
  const params = new URLSearchParams(window.location.search);
  const urlGenre = params.get('genre');
  const urlSearch = params.get('search');

  // If a global search redirected us here, pre-fill the search bar
  if (urlSearch) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = urlSearch;
  }

  loadGenres().then(() => {
    if (urlGenre) {
      const genreSelect = document.getElementById('genreFilter');
      const genreText = document.getElementById('genreSelectedText');
      const dropdownItems = document.querySelectorAll('#genreDropdownList .dropdown-item');
      if (genreSelect && genreText && dropdownItems.length) {
        // Find matching option case-insensitively
        for (let i = 0; i < dropdownItems.length; i++) {
          const itemVal = dropdownItems[i].dataset.value;
          if (itemVal.toLowerCase() === urlGenre.toLowerCase() || 
             (urlGenre.toLowerCase() === 'all' && itemVal === '')) {
            genreSelect.value = itemVal;
            genreText.textContent = dropdownItems[i].textContent;
            break;
          }
        }
      }
    }
    // Only load games after the dropdown has been correctly populated and set
    loadGames();
    if ((urlGenre || urlSearch) && typeof scrollToGamesSection === 'function') {
      // Small delay to let games render before scrolling
      setTimeout(scrollToGamesSection, 300);
    }
  });
  
  setupFilters();
  setupSearch();

  // 3. Setup Search Listener
  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');
  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Mobile expandable search logic
      if (window.innerWidth <= 768) {
        if (!searchInput.classList.contains('mobile-expanded')) {
          searchInput.classList.add('mobile-expanded');
          searchInput.focus();
          return;
        }
        // If it is expanded but empty, just close it
        if (searchInput.value.trim() === '') {
          searchInput.classList.remove('mobile-expanded');
          return;
        }
      } else {
        // Desktop logic: if empty, do absolutely nothing (prevent redundant fetch and AOS animation)
        if (searchInput.value.trim() === '') {
          return;
        }
      }
      loadGames(1);
    });

    // Close mobile search when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!e.target.closest('.search-box') && searchInput.classList.contains('mobile-expanded')) {
          searchInput.classList.remove('mobile-expanded');
        }
      }
    });
  }

  /* --- Update handleGridClick in js/games.js --- */
const handleGridClick = (e) => {
  const detailsBtn = e.target.closest('.btn-view-details') || e.target.closest('.btn-primary');
  const addToCartBtn = e.target.closest('.btn-add-cart') || e.target.closest('.btn-secondary');
  const gameCard = e.target.closest('.game-card');

  // 1. Handle Add to Cart Button cite: 144
  if (addToCartBtn) {
    e.stopPropagation(); // CRITICAL: Stops the card click from firing cite: 144
    const gameId = addToCartBtn.dataset.id;
    if (typeof addToCart === 'function') {
      addToCart(gameId); // Calls cart.js logic cite: 144
    }
    return; // Exit so we don't trigger details cite: 144
  }

  // 2. Handle Details cite: 144
  if (detailsBtn || gameCard) {
    const gameId = gameCard ? gameCard.dataset.gameId : null;
    if (gameId) {
      viewGameDetails(gameId); // cite: 144
    }
  }
};

  document.getElementById('gamesGrid')?.addEventListener('click', handleGridClick);
  document.getElementById('featuredGames')?.addEventListener('click', handleGridClick);
});

// Display featured games
function displayFeaturedGames(games) {
  // 1. Setup Hero Carousel with top 6 games
  const topGames = games.slice(0, 6);
  if (document.getElementById('heroCarousel')) {
    setupHeroCarousel(topGames);
  }

  // 2. Setup Featured Games Grid (exclude the top 6 games shown in banner, show next 10)
  const remainingFeaturedGames = games.slice(6, 16);
  const container = document.getElementById('featuredGames');
  if (!container) return;

  if (remainingFeaturedGames.length === 0) {
    container.innerHTML = '<p class="empty-state">No featured games available</p>';
    return;
  }

  container.innerHTML = remainingFeaturedGames.map(game => createGameCard(game, true)).join('');
}

// --- HERO CAROUSEL LOGIC ---
let currentSlideIndex = 0;
let carouselInterval;
let carouselGames = [];

function setupHeroCarousel(games) {
  if (!games || games.length === 0) return;
  carouselGames = games;
  
  const inner = document.getElementById('carouselInner');
  const indicators = document.getElementById('carouselIndicators');
  
  if (!inner || !indicators) return;

  // Build Slides
  inner.innerHTML = games.map((game, index) => {
    const finalPrice = game.discount > 0 
      ? Math.round(game.price * (1 - game.discount / 100)) 
      : game.price;
      
    // Use high-res screenshot for banner if available, otherwise fallback to cover
    const bannerImage = (game.images && game.images.length > 0) ? game.images[0] : game.coverImage;
      
    return `
      <div class="carousel-slide ${index === 0 ? 'active' : ''}" 
           style="background-image: url('${escapeHTML(bannerImage)}');"
           data-mobile-image="${escapeHTML(game.coverImage)}"
           data-desktop-image="${escapeHTML(bannerImage)}">
        <div class="carousel-content" data-aos="fade-up" data-aos-delay="200">
          ${game.discount > 0 ? `<div class="carousel-badge" style="margin-bottom: 0.5rem; display: inline-block; font-size: 0.8rem; padding: 0.15rem 0.6rem;">-${escapeHTML(game.discount)}% OFF</div>` : ''}
          <h2>${escapeHTML(game.title)}</h2>
          <p>${escapeHTML(game.shortDescription)}</p>
          <div class="carousel-meta">
            <span class="carousel-badge">${escapeHTML(game.genres?.[0] || 'Action')}</span>
            <span class="carousel-badge">⭐ ${escapeHTML(game.rating || '4.5')}</span>
          </div>
          <div class="carousel-actions">
            <button class="btn-primary" onclick="viewGameDetails('${escapeHTML(game._id)}')">View Details</button>
            <div class="carousel-price" style="display:flex; align-items:center;">
              ${finalPrice === 0 ? 'FREE' : '₹' + finalPrice.toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Build Indicators (Thumbnail Strip)
  indicators.innerHTML = games.map((game, index) => 
    `<div class="carousel-indicator ${index === 0 ? 'active' : ''}" 
          style="background-image: url('${escapeHTML(game.coverImage)}');"
          onclick="goToSlide(${index})">
     </div>`
  ).join('');

  // Setup Event Listeners for Controls
  document.getElementById('carouselPrev')?.addEventListener('click', () => moveCarousel(-1));
  document.getElementById('carouselNext')?.addEventListener('click', () => moveCarousel(1));

  // Swap banner images based on screen size (portrait on mobile/tablet, landscape on desktop)
  function swapCarouselImages() {
    const isMobile = window.innerWidth <= 1024;
    document.querySelectorAll('.carousel-slide').forEach(slide => {
      const mobileImg = slide.dataset.mobileImage;
      const desktopImg = slide.dataset.desktopImage;
      if (isMobile && mobileImg) {
        slide.style.backgroundImage = `url('${mobileImg}')`;
      } else if (!isMobile && desktopImg) {
        slide.style.backgroundImage = `url('${desktopImg}')`;
      }
    });
  }

  // Run on load and whenever the window is resized
  swapCarouselImages();
  window.addEventListener('resize', swapCarouselImages);

  // Start Auto Play
  startCarouselAutoPlay();
}

function updateCarouselUI() {
  const slides = document.querySelectorAll('.carousel-slide');
  const indicators = document.querySelectorAll('.carousel-indicator');
  
  if (slides.length === 0) return;
  
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === currentSlideIndex);
  });
  
  indicators.forEach((ind, i) => {
    ind.classList.toggle('active', i === currentSlideIndex);
  });
}

function moveCarousel(direction) {
  if (carouselGames.length === 0) return;
  currentSlideIndex = (currentSlideIndex + direction + carouselGames.length) % carouselGames.length;
  updateCarouselUI();
  resetCarouselAutoPlay();
}

function goToSlide(index) {
  currentSlideIndex = index;
  updateCarouselUI();
  resetCarouselAutoPlay();
}

function startCarouselAutoPlay() {
  carouselInterval = setInterval(() => moveCarousel(1), 5000); // Change slide every 5s
}

function resetCarouselAutoPlay() {
  clearInterval(carouselInterval);
  startCarouselAutoPlay();
}

// Safer version of displayGames
function displayGames(games) {
  const container = document.getElementById('gamesGrid');
  if (!container) return;

  const renderContent = () => {
    if (!games || !Array.isArray(games)) {
      console.error("displayGames Error: Data received is not an array:", games);
      container.innerHTML = '<p class="empty-state">Error loading games. Please try again.</p>';
      return;
    }

    if (games.length === 0) {
      container.innerHTML = '<p class="empty-state">No games found</p>';
      return;
    }

    container.innerHTML = games.map(game => createGameCard(game)).join('');
    setupHoverCarousels();
  };

  // Modern "Isotope" shuffle effect using View Transitions API
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      renderContent();
    });
  } else {
    renderContent();
  }
}

// Create game card HTML
function createGameCard(game, isFeatured = false) {
  const finalPrice = game.discount > 0
  ? Math.round(game.price * (1 - game.discount / 100)) // Added Math.round here
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
    `<span class="genre-tag">${escapeHTML(genre)}</span>`
  ).join('') || '';

  const transitionId = isFeatured ? `feat-${game._id}` : `game-${game._id}`;
  return `
    <div class="game-card" data-aos="fade-up" data-game-id="${escapeHTML(game._id)}" style="view-transition-name: ${escapeHTML(transitionId)};">
      <img src="${escapeHTML(game.coverImage)}" alt="${escapeHTML(game.title)}" class="game-image" data-cover="${escapeHTML(game.coverImage)}" data-images='${escapeHTML(JSON.stringify(game.images || []))}'>
      <div class="game-info">
        <h3 class="game-title">${escapeHTML(game.title)}</h3>
        <p class="game-description">${escapeHTML(game.shortDescription || game.description || '')}</p>
        <div class="game-genres">${genres}</div>
        <div class="game-meta">
          <div class="game-price">
            ${priceDisplay}
            ${discountBadge}
          </div>
          <div class="game-rating">
            ⭐ ${escapeHTML(game.rating?.toFixed(1) || '0.0')}
          </div>
        </div>
        
        <div class="game-actions">
          <button class="btn-primary btn-view-details" data-id="${escapeHTML(game._id)}">View Details</button>
          <button type="button" class="btn-secondary btn-add-cart" data-id="${escapeHTML(game._id)}">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  `;
}

// Hover Mini-Carousel Logic
function setupHoverCarousels() {
  const cards = document.querySelectorAll('.game-card');
  
  cards.forEach(card => {
    let intervalId;
    let currentIndex = 0;
    const imgElement = card.querySelector('.game-image');
    
    if (!imgElement) return;
    
    // Safely parse images
    let images = [];
    try {
      images = JSON.parse(imgElement.getAttribute('data-images') || '[]');
    } catch (e) {
      images = [];
    }
    
    const coverImage = imgElement.getAttribute('data-cover');

    card.addEventListener('mouseenter', () => {
      if (images && images.length > 0) {
        // Start cycling through high-res images
        intervalId = setInterval(() => {
          currentIndex = (currentIndex + 1) % images.length;
          imgElement.src = images[currentIndex];
        }, 1200); // Change image every 1.2s
      }
    });

    card.addEventListener('mouseleave', () => {
      // Stop cycling and reset to cover image
      clearInterval(intervalId);
      currentIndex = 0;
      imgElement.src = coverImage;
    });
  });
}

async function viewGameDetails(gameId) {
    const modal = document.getElementById('gameModal');
    const contentContainer = document.getElementById('gameDetails');

    if (!modal || !contentContainer) return;

    // 1. CLEAR OLD DATA (Fixes the "Ghost Content" issue)
    contentContainer.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:300px;">
            <div class="loading"></div>
        </div>
    `;

    // 2. LOCK SCROLL (Fixes the "Jump to Top" issue)
    if (typeof window.lockScroll === 'function') {
        window.lockScroll();
    }

    // 3. OPEN MODAL
    modal.style.display = 'block';
    requestAnimationFrame(() => {
        modal.classList.add('show');
    });

    try {
        // 4. FETCH & SHOW NEW DATA
        const game = await gamesAPI.getById(gameId);
        displayGameDetails(game);
    } catch (error) {
        contentContainer.innerHTML = `<p class="empty-state">Failed to load game.</p>`;
    }
}

// Display game details in modal
function displayGameDetails(game) {
  const container = document.getElementById('gameDetails');
  const modal = document.getElementById('gameModal');
  if (!modal || !container) return;

  // Pricing Logic
  const finalPrice = game.discount > 0
  ? Math.round(game.price * (1 - game.discount / 100)) // Added Math.round here
  : game.price;

  const discountBadge = game.discount > 0
    ? `<span class="discount-badge">-${game.discount}% OFF</span>`
    : '';

  const priceDisplay = finalPrice === 0
    ? `<div class="price-current" style="font-size: 2rem; color: #00ff88;">FREE</div>`
    : game.discount > 0
      ? `<div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
           <span class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</span>
           <span class="price-original" style="font-size: 1.1rem;">₹${game.price.toLocaleString('en-IN')}</span>
           ${discountBadge}
         </div>`
      : `<div class="price-current" style="font-size: 2rem;">₹${finalPrice.toLocaleString('en-IN')}</div>`;

  const genres = game.genres?.map(g => `<span class="genre-tag">${escapeHTML(g)}</span>`).join('') || '';
  const tags = game.tags?.map(t => `<span class="genre-tag">${escapeHTML(t)}</span>`).join('') || '';

  // Generate System Requirements HTML
  const systemReq = game.systemRequirements ? `
   <div class="system-requirements">
      <h4>System Requirements</h4>
      <div class="req-grid" style="display: grid; gap: 2rem;">
        <div>
          <h5>Minimum</h5>
          <p><strong>OS:</strong> ${escapeHTML(game.systemRequirements.minimum?.os || 'N/A')}</p>
          <p><strong>Processor:</strong> ${escapeHTML(game.systemRequirements.minimum?.processor || 'N/A')}</p>
          <p><strong>Memory:</strong> ${escapeHTML(game.systemRequirements.minimum?.memory || 'N/A')}</p>
          <p><strong>Graphics:</strong> ${escapeHTML(game.systemRequirements.minimum?.graphics || 'N/A')}</p>
          <p><strong>Storage:</strong> ${escapeHTML(game.systemRequirements.minimum?.storage || 'N/A')}</p>
        </div>
        <div>
          <h5>Recommended</h5>
          <p><strong>OS:</strong> ${escapeHTML(game.systemRequirements.recommended?.os || 'N/A')}</p>
          <p><strong>Processor:</strong> ${escapeHTML(game.systemRequirements.recommended?.processor || 'N/A')}</p>
          <p><strong>Memory:</strong> ${escapeHTML(game.systemRequirements.recommended?.memory || 'N/A')}</p>
          <p><strong>Graphics:</strong> ${escapeHTML(game.systemRequirements.recommended?.graphics || 'N/A')}</p>
          <p><strong>Storage:</strong> ${escapeHTML(game.systemRequirements.recommended?.storage || 'N/A')}</p>
        </div>
      </div>
   </div>` : '';

  // Inject HTML
  container.innerHTML = `
    <div class="game-details">
      <div class="game-details-header">
        <img src="${escapeHTML(game.images[0])}" alt="${escapeHTML(game.title)}" style="width: 100%; max-height: 400px; object-fit: cover; border-radius: 10px; margin-bottom: 2rem;">
        <h2>${escapeHTML(game.title)}</h2>
        <div class="game-details-meta">
          <p><strong>Developer:</strong> ${escapeHTML(game.developer)}</p>
          <p><strong>Publisher:</strong> ${escapeHTML(game.publisher)}</p>
          <p><strong>Release Date:</strong> ${escapeHTML(new Date(game.releaseDate).toLocaleDateString())}</p>
          <div class="game-rating" style="margin-top: 1rem;">⭐ ${escapeHTML(game.rating?.toFixed(1) || '0.0')} Rating</div>
        </div>
      </div>
      <div class="game-details-content">
        <div class="game-description-full">
  <h3>About</h3>
  ${(game.description || '')
      .split(/\n\s*\n/)
      .map(paragraph => `<p>${escapeHTML(paragraph.trim())}</p>`)
      .join('')
    }
</div>

        <div class="game-genres-tags">
          <h4>Genres</h4>
          <div class="game-genres">${genres}</div>
          ${tags ? `<h4 style="margin-top: 1rem;">Tags</h4><div class="game-genres">${tags}</div>` : ''}
        </div>
        ${systemReq}
        <div class="game-details-actions" style="margin-top: 2rem; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 1rem;">
          ${priceDisplay}
          <div style="display: flex; gap: 1rem; align-items: center;">
            <button class="btn-primary" onclick="addToCart('${escapeHTML(game._id)}'); document.getElementById('gameModal').style.display='none'; document.body.classList.remove('modal-open');">Add to Cart</button>
          </div>
        </div>
      </div>
    </div>
  `;

  

/* --- Global Modal Closing Logic in games.js --- */
document.addEventListener('click', (e) => {
    const gameModal = document.getElementById('gameModal');
    const loginModal = document.getElementById('loginModal');

    // 1. Check if the 'X' button was clicked
    if (e.target.classList.contains('close')) {
        const modal = e.target.closest('.modal');
        if (modal) {
            closeSpecificModal(modal);
        }
    }

    
});

// Helper function to handle the 400ms smooth fade-out
function closeSpecificModal(modal) {
    modal.classList.remove('show'); // Triggers CSS fade-out cite: 15
    setTimeout(() => {
        modal.style.display = 'none'; // Fully hides after animation cite: 15
        document.body.classList.remove('modal-open'); // Removes background blur cite: 15
    }, 400);
}
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
  // Use a smaller delta on mobile so pagination fits on one line
  const delta = window.innerWidth <= 768 ? 1 : 2;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
      html += `
        <button class="${i === currentPage ? 'active' : ''}" 
                onclick="loadGames(${i}); scrollToGamesSection();">
          ${i}
        </button>
      `;
    } else if (i === currentPage - (delta + 1) || i === currentPage + (delta + 1)) {
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







