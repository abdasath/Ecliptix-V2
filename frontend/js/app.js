const menuBtn = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');
const menuClose = document.querySelector('.menu-close');

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  console.log('Ecliptix initialized');
  
  // Check if we're on the main page
  if (document.getElementById('gamesGrid')) {
    // Games page specific initialization
    console.log('Games page loaded');
  }

  /* --- JavaScript Update in app.js --- */
const checkAdminStatus = () => {
    // Note: auth.js uses 'userInfo', so we check that key
    const userString = localStorage.getItem('userInfo');
    const adminLinks = document.querySelectorAll('a[href="admin.html"]');

    if (userString) {
        const user = JSON.parse(userString);
        // Match the role check used in your auth.js (user.role === 'admin')
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

});


// Toggle menu
menuBtn.addEventListener('click', () => {
    navMenu.classList.toggle('open');
    menuBtn.classList.toggle('active');
});

// Close from X inside menu
if (menuClose) {
    menuClose.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuBtn.classList.remove('active');
    });
}

// Close on link click
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        menuBtn.classList.remove('active');
    });
});

// In your app.js where you handle the login button click
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        document.getElementById('loginModal').style.display = 'block';
        
        // This is the magic line that hides the 'behind things'
        if (window.innerWidth <= 768) {
            document.body.classList.add('modal-open'); 
        }
    });
}



// Example for Cart Icon
const cartIcon = document.getElementById('cartIcon');
cartIcon.addEventListener('click', () => {
    document.getElementById('cartModal').style.display = 'block';
    if (window.innerWidth <= 768) {
        document.body.classList.add('modal-open'); // Trigger blur
    }
    renderCart(); // Call your function to refresh cart items
});

// Update ALL close buttons (X) to remove the class
document.querySelectorAll('.close').forEach(btn => {
    btn.addEventListener('click', () => {
        document.body.classList.remove('modal-open'); // Restore background
    });
});

// Restore when clicking outside the modals
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        document.body.classList.remove('modal-open');
    }
});



