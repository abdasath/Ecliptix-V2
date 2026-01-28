// const menuBtn = document.querySelector('.menu-toggle');
// const navMenu = document.querySelector('.nav-menu');
// const menuClose = document.querySelector('.menu-close');

// // Main application initialization
// document.addEventListener('DOMContentLoaded', () => {
//   // Initialize all modules
//   console.log('Ecliptix initialized');
  
//   // Check if we're on the main page
//   if (document.getElementById('gamesGrid')) {
//     // Games page specific initialization
//     console.log('Games page loaded');
//   }

//   /* --- JavaScript Update in app.js --- */
// const checkAdminStatus = () => {
//     // Note: auth.js uses 'userInfo', so we check that key
//     const userString = localStorage.getItem('userInfo');
//     const adminLinks = document.querySelectorAll('a[href="admin.html"]');

//     if (userString) {
//         const user = JSON.parse(userString);
//         // Match the role check used in your auth.js (user.role === 'admin')
//         if (user.role === 'admin') {
//             adminLinks.forEach(link => {
//                 link.style.setProperty('display', 'block', 'important');
//                 if (link.parentElement.tagName === 'LI') {
//                     link.parentElement.style.setProperty('display', 'block', 'important');
//                 }
//             });
//         }
//     } else {
//         adminLinks.forEach(link => {
//             link.style.display = 'none';
//             if (link.parentElement.tagName === 'LI') {
//                 link.parentElement.style.display = 'none';
//             }
//         });
//     }
// };

// });


// // Toggle menu
// menuBtn.addEventListener('click', () => {
//     navMenu.classList.toggle('open');
//     menuBtn.classList.toggle('active');
// });

// // Close from X inside menu
// if (menuClose) {
//     menuClose.addEventListener('click', () => {
//         navMenu.classList.remove('open');
//         menuBtn.classList.remove('active');
//     });
// }

// // Close on link click
// document.querySelectorAll('.nav-menu a').forEach(link => {
//     link.addEventListener('click', () => {
//         navMenu.classList.remove('open');
//         menuBtn.classList.remove('active');
//     });
// });

// // // In your app.js where you handle the login button click
// // const loginBtn = document.getElementById('loginBtn');
// // if (loginBtn) {
// //     loginBtn.addEventListener('click', () => {
// //         document.getElementById('loginModal').style.display = 'block';
        
// //         // This is the magic line that hides the 'behind things'
// //         if (window.innerWidth <= 768) {
// //             document.body.classList.add('modal-open'); 
// //         }
// //     });
// // }



// // Example for Cart Icon
// const cartIcon = document.getElementById('cartIcon');
// cartIcon.addEventListener('click', () => {
//     document.getElementById('cartModal').style.display = 'block';
//     if (window.innerWidth <= 768) {
//         document.body.classList.add('modal-open'); // Trigger blur
//     }
//     renderCart(); // Call your function to refresh cart items
// });

// /* --- Update in app.js --- */
// document.querySelectorAll('.close').forEach(btn => {
//     btn.addEventListener('click', () => {
//         const modal = btn.closest('.modal');
//         if (modal) {
//             modal.classList.remove('show');
//             setTimeout(() => {
//                 modal.style.display = 'none';
//                 // Only remove blur if no other modals are open cite: 19
//                 if (!document.querySelector('.modal.show')) {
//                     document.body.classList.remove('modal-open');
//                 }
//             }, 400);
//         }
//     });
// });

// // Restore when clicking outside the modals
// window.addEventListener('click', (e) => {
//     if (e.target.classList.contains('modal')) {
//         document.body.classList.remove('modal-open');
//     }
// });
// /* --- Update this block in app.js --- */
// const cartBtn = document.getElementById('cartBtn');
// const cartModal = document.getElementById('cartModal');

// if (cartBtn && cartModal) {
//     cartBtn.addEventListener('click', (e) => {
//         e.preventDefault();
        
//         // 1. Make the modal exist in the layout
//         cartModal.style.display = 'block';
        
//         // 2. Trigger the smooth fade-in class cite: 15
//         requestAnimationFrame(() => {
//             cartModal.classList.add('show');
//             document.body.classList.add('modal-open');
//         });
        
//         // 3. Refresh the items cite: 18
//         if (typeof renderCart === 'function') {
//             renderCart(); 
//         }
//     });
// }


// function toggleAuth() {
//     const loginView = document.getElementById('loginView');
//     const registerView = document.getElementById('registerView');
    
//     if (loginView.style.display === 'none') {
//         loginView.style.display = 'block';
//         registerView.style.display = 'none';
//     } else {
//         loginView.style.display = 'none';
//         registerView.style.display = 'block';
//     }
// }

// // Add this inside your DOMContentLoaded in app.js
// const authContainer = document.getElementById('authContainer');
// const toRegister = document.getElementById('toRegister');
// const toLogin = document.getElementById('toLogin');

// if (toRegister && toLogin) {
//     toRegister.addEventListener('click', () => {
//         authContainer.classList.add('active');
//     });

//     toLogin.addEventListener('click', () => {
//         authContainer.classList.remove('active');
//     });
// }


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