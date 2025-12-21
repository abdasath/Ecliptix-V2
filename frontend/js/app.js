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

