
const menuBtn = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const menuClose = document.querySelector('.menu-close');

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ecliptix initialized');
    checkAdminStatus(); // Check for admin immediately
    setupGlobalSearch(); // Setup universal search bar routing
});

// Setup universal search bar for non-store pages
function setupGlobalSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                const isStore = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
                const isAdmin = window.location.pathname.endsWith('admin.html');
                if (!isStore && !isAdmin) {
                    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
                }
            }
        }
    });
}

// Admin Status Checker
const checkAdminStatus = () => {
    const userString = localStorage.getItem('userInfo');
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');

    if (userString) {
        const user = JSON.parse(userString);
        if (user.role === 'admin') {
            adminLinks.forEach(link => {
                link.style.setProperty('display', 'block', 'important');
                if (link.parentElement.tagName === 'LI') {
                    link.parentElement.style.setProperty('display', 'block', 'important');
                }
            });
        }
    } else {
        adminLinks.forEach(link => {
            link.style.display = 'none';
            if (link.parentElement.tagName === 'LI') {
                link.parentElement.style.display = 'none';
            }
        });
    }
};

/* --- UPDATED MOBILE MENU LOGIC --- */
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        // 1. Toggle the Menu
        navMenu.classList.toggle('open');
        menuBtn.classList.toggle('active');
        
        // 2. Lock the Scroll & Blur Background
        document.body.classList.toggle('menu-open');
    });
}

// Close Menu when clicking the 'X' inside
if (menuClose) {
    menuClose.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open'); // Unlock scroll
    });
}

// Close Menu when clicking a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', (e) => {
        const text = link.textContent.trim();
        const genres = ['Action', 'Adventure', 'Horror', 'Open World', 'RPG', 'All Games'];
        
        if (genres.includes(text)) {
            e.preventDefault();
            
            // 1. Close Menu and Unlock Scroll FIRST so scrollIntoView works
            navMenu.classList.remove('open');
            if (menuBtn) menuBtn.classList.remove('active');
            document.body.classList.remove('menu-open');
            
            // 2. Check if we are on the store page (index.html)
            const path = window.location.pathname;
            if (path.endsWith('index.html') || path.endsWith('/') || path.endsWith('frontend/')) {
                const genreSelect = document.getElementById('genreFilter');
                if (genreSelect) {
                    // "All Games" sets value to empty string to show all
                    const targetValue = (text === 'All Games' || text === 'All') ? '' : text;
                    
                    // Iterate and select the matching option case-insensitively
                    for (let i = 0; i < genreSelect.options.length; i++) {
                        if (genreSelect.options[i].value.toLowerCase() === targetValue.toLowerCase()) {
                            genreSelect.value = genreSelect.options[i].value;
                            break;
                        }
                    }
                    
                    if (typeof loadGames === 'function') {
                        loadGames(1);
                        if (typeof scrollToGamesSection === 'function') {
                            // Slight delay allows the menu to close before scrolling
                            setTimeout(scrollToGamesSection, 100);
                        }
                    }
                }
            } else {
                // Redirect to store page with genre parameter
                window.location.href = `index.html?genre=${text === 'All Games' ? 'All' : text}`;
            }
        } else {
            // If it's a regular link, just close the menu
            navMenu.classList.remove('open');
            if (menuBtn) menuBtn.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    });
});

// --- GLOBAL MODAL CLOSING LOGIC (Fixes Scroll Issue) ---
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
            closeModalUniversal(modal);
        }
    });
});


function closeModalUniversal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
        
        // Only unlock if no other modals are open
        if (document.querySelectorAll('.modal.show').length === 0) {
            if (typeof window.unlockScroll === 'function') {
                window.unlockScroll(); // Restores your position
            } else {
                document.body.classList.remove('modal-open');
            }
        }
    }, 400);
}

/* --- Updated Auth Toggle Logic (Supports Mobile Links) --- */
const authContainer = document.getElementById('authContainer');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');
const mobileToRegister = document.getElementById('mobileToRegister'); // New
const mobileToLogin = document.getElementById('mobileToLogin');       // New

// Helper function to switch to Register View
function showRegister() {
    authContainer.classList.add('active');
}

// Helper function to switch to Login View
function showLogin() {
    authContainer.classList.remove('active');
}

// Event Listeners (Desktop & Mobile)
if (authContainer) {
    if (toRegister) toRegister.addEventListener('click', showRegister);
    if (toLogin) toLogin.addEventListener('click', showLogin);
    
    // Mobile text link listeners
    if (mobileToRegister) mobileToRegister.addEventListener('click', showRegister);
    if (mobileToLogin) mobileToLogin.addEventListener('click', showLogin);
}
/* --- GLOBAL SCROLL LOCK LOGIC --- */
let scrollPosition = 0;

window.lockScroll = function() {
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
};

/* --- UPDATED unlockScroll in js/app.js --- */
window.unlockScroll = function() {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
};