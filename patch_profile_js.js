const fs = require('fs');
let js = fs.readFileSync('frontend/js/profile.js', 'utf8');

const oldFunc = `// Show login prompt
function showLoginPrompt() {
  const profileSection = document.querySelector('.profile-section');
  if (profileSection) {
    // FIX: Changed onclick to use your global openLoginModal() function
    profileSection.innerHTML = \`
      <div class="empty-state">
        <p>Please login to view your profile</p>
        <button class="btn-primary" onclick="openLoginModal()">Login</button>
      </div>
    \`;
  }
}`;

const newFunc = `// Show login prompt
function showLoginPrompt() {
  const profileContent = document.querySelector('.profile-content');
  const emptyState = document.getElementById('emptyProfile');
  
  if (profileContent) profileContent.style.display = 'none';
  if (emptyState) {
    emptyState.style.display = 'block';
    emptyState.innerHTML = \`
      <i class='bx bx-user-circle empty-state-icon'></i>
      <h3 class="empty-state-title">Join the Ecliptix Community</h3>
      <p class="empty-state-desc">Create a profile to earn rewards, customize your avatar, add funds to your wallet, and track your purchase history.</p>
      <button class="btn-primary" onclick="openLoginModal()" style="margin-top: 1rem; font-size: 1.1rem; padding: 0.8rem 2rem;">Sign In / Register</button>
    \`;
  }
}`;

js = js.replace(oldFunc, newFunc);
fs.writeFileSync('frontend/js/profile.js', js);
