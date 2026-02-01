
const menuBtn = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const menuClose = document.querySelector('.menu-close');

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Ecliptix initialized');
    checkAdminStatus(); // Check for admin immediately
});

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
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuBtn.classList.remove('active');
        document.body.classList.remove('menu-open'); // Unlock scroll
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
    // 1. Remember exactly where you are
    scrollPosition = window.scrollY;
    
    // 2. Freeze the body at that exact negative pixel
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    
    document.body.classList.add('modal-open');
};

/* --- UPDATED unlockScroll in js/app.js --- */
window.unlockScroll = function() {
    // 1. Unfreeze the body
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');

    // 2. DISABLE SMOOTH SCROLLING (The Magic Fix)
    // This forces the browser to jump instantly instead of sliding
    document.documentElement.style.scrollBehavior = 'auto';

    // 3. INSTANTLY jump back to the saved spot
    window.scrollTo(0, scrollPosition);

    // 4. Re-enable smooth scrolling after the jump is done
    setTimeout(() => {
        document.documentElement.style.scrollBehavior = '';
    }, 50);
};