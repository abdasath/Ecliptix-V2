import re

with open('frontend/js/auth.js', 'r') as f:
    content = f.read()

# Fix updateUIForLoggedIn
old_loggedin = """  // Hide auth-only navbar items
  document.querySelectorAll('.auth-only-nav').forEach(element => {
    element.style.display = 'none';
  });"""

new_loggedin = """  // Show auth-only navbar items (Library & Profile)
  document.querySelectorAll('.auth-only-nav').forEach(element => {
    element.style.display = 'block';
  });"""

content = content.replace(old_loggedin, new_loggedin)

# Fix updateUIForLoggedOut
old_loggedout = """  if (navWallet) navWallet.textContent = 'Please sign in';
  if (navMobileLogout) navMobileLogout.style.display = 'none';
}"""

new_loggedout = """  if (navWallet) navWallet.textContent = 'Please sign in';
  if (navMobileLogout) navMobileLogout.style.display = 'none';

  // Hide auth-only navbar items (Library & Profile)
  document.querySelectorAll('.auth-only-nav').forEach(element => {
    element.style.display = 'none';
  });
}"""

content = content.replace(old_loggedout, new_loggedout)

with open('frontend/js/auth.js', 'w') as f:
    f.write(content)

print("Auth JS nav visibility patched")
