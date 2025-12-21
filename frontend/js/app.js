// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  console.log('Ecliptix initialized');
  
  // Check if we're on the main page
  if (document.getElementById('gamesGrid')) {
    // Games page specific initialization
    console.log('Games page loaded');
  }
});

const menuBtn = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

menuBtn.addEventListener('click', () => {
  navMenu.classList.toggle('open');
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