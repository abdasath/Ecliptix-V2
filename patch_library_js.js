const fs = require('fs');
let js = fs.readFileSync('frontend/js/library.js', 'utf8');

const oldFunc = `function showLoginPrompt() {
  const container = document.getElementById('libraryGames');
  const emptyState = document.getElementById('emptyLibrary');

  if (container) container.style.display = 'none';
  if (emptyState) {
    emptyState.style.display = 'block';
    
    // FIX: Changed onclick to use your global openLoginModal() function
    emptyState.innerHTML = \`
      <p>Please login to view your game library</p>
      <button class="btn-primary" onclick="openLoginModal()">Login</button>
    \`;
  }
}`;

const newFunc = `function showLoginPrompt() {
  const container = document.getElementById('libraryGames');
  const emptyState = document.getElementById('emptyLibrary');

  if (container) container.style.display = 'none';
  if (emptyState) {
    emptyState.style.display = 'block';
    emptyState.innerHTML = \`
      <i class='bx bx-joystick empty-state-icon'></i>
      <h3 class="empty-state-title">Your Gaming Journey Awaits</h3>
      <p class="empty-state-desc">Log in to access your purchased games, track your playtime, and download your favorites to your collection.</p>
      <button class="btn-primary" onclick="openLoginModal()" style="margin-top: 1rem; font-size: 1.1rem; padding: 0.8rem 2rem;">Sign In / Register</button>
    \`;
  }
}`;

js = js.replace(oldFunc, newFunc);
fs.writeFileSync('frontend/js/library.js', js);
