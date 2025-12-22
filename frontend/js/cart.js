// 🚨 HARD BLOCK any browser navigation to /cart
document.addEventListener("click", (e) => {
  const target = e.target.closest("a, button");
  if (!target) return;

  const href = target.getAttribute("href");
  if (href && href.startsWith("/cart")) {
    e.preventDefault();
    e.stopPropagation();
    console.warn("Blocked native cart navigation:", href);
  }
});

// 🚨 Prevent ANY form from submitting
document.addEventListener("submit", (e) => {
  e.preventDefault();
  console.warn("Blocked form submit:", e.target);
});



// Shopping Cart Management
let cartItems = [];

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    loadCart();
  }
  setupCartModal();
});

// Load cart from API
async function loadCart() {
  if (!isAuthenticated()) {
    cartItems = [];
    updateCartUI();
    return;
  }

  try {
    const items = await cartAPI.get();
    cartItems = items;
    updateCartUI();
  } catch (error) {
    console.error('Failed to load cart:', error);
    cartItems = [];
    updateCartUI();
  }
}

// Add game to cart
async function addToCart(gameId) {
  if (!isAuthenticated()) {
    alert('Please login to add games to cart');
    const loginModal = document.getElementById('loginModal');
    if (loginModal) loginModal.style.display = 'block';
    return;
  }

  try {
    await cartAPI.add(gameId);
    await loadCart();
    showNotification('Game added to cart!', 'success');
  } catch (error) {
    alert(error.message || 'Failed to add game to cart');
  }
}

// Remove game from cart
async function removeFromCart(gameId) {
  try {
    await cartAPI.remove(gameId);
    await loadCart();
    showNotification('Game removed from cart', 'info');
  } catch (error) {
    alert(error.message || 'Failed to remove game from cart');
  }
}

// Clear cart
async function clearCart() {
  try {
    await cartAPI.clear();
    await loadCart();
    showNotification('Cart cleared', 'info');
  } catch (error) {
    alert(error.message || 'Failed to clear cart');
  }
}

// Update cart UI
function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  // Update cart count
  if (cartCount) {
    cartCount.textContent = cartItems.length;
    cartCount.style.display = cartItems.length > 0 ? 'flex' : 'none';
  }

  // Update cart items display
  if (cartItemsContainer) {
    if (cartItems.length === 0) {
      cartItemsContainer.innerHTML = '<p class="empty-state">Your cart is empty</p>';
    } else {
      let total = 0;
      cartItemsContainer.innerHTML = cartItems.map(item => {
        const game = item.game;
        if (!game) return '';
        
        const finalPrice = game.discount > 0 
          ? game.price * (1 - game.discount / 100) 
          : game.price;
        total += finalPrice;

        return `
          <div class="cart-item">
            <img src="${game.coverImage}" alt="${game.title}" class="cart-item-image">
            <div class="cart-item-info">
              <h4>${game.title}</h4>
              <p class="cart-item-price">₹${finalPrice.toLocaleString('en-IN')}</p>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart('${game._id}')">×</button>
          </div>
        `;
      }).join('');

      if (cartTotal) {
        cartTotal.textContent = total.toLocaleString('en-IN');
      }
    }
  }
}

// Setup cart modal
function setupCartModal() {
  const cartIcon = document.getElementById('cartIcon');
  const cartModal = document.getElementById('cartModal');
  const closeBtn = cartModal?.querySelector('.close');
  const checkoutBtn = document.getElementById('checkoutBtn');

  if (cartIcon) {
    cartIcon.addEventListener('click', () => {
      if (!isAuthenticated()) {
        alert('Please login to view your cart');
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'block';
        return;
      }
      if (cartModal) cartModal.style.display = 'block';
      loadCart();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (cartModal) cartModal.style.display = 'none';
    });
  }

  if (cartModal) {
    window.addEventListener('click', (e) => {
      if (e.target === cartModal) {
        cartModal.style.display = 'none';
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

/* --- Update handleCheckout in js/cart.js --- */
async function handleCheckout() {
    try {
        const response = await ordersAPI.checkout();
        
        // Backend returns the order object on success
        if (response._id) {
            showNotification('Purchase successful!', 'success');
            
            // 1. Clear the local cart data
            cartItems = []; 
            updateCartUI(); 
            
            // 2. Update the navbar wallet balance globally
            if (typeof checkAuthStatus === 'function') {
                await checkAuthStatus(); 
            }
            
            // 3. Close the modal
            document.getElementById('cartModal').style.display = 'none';
            document.body.classList.remove('modal-open');

            // 4. Safely refresh page-specific data if functions exist
            if (typeof loadLibrary === 'function') loadLibrary();
            if (typeof loadProfile === 'function') loadProfile();
            
        } else {
            alert(response.message || 'Checkout failed');
        }
    } catch (error) {
        alert(error.message || 'Checkout failed');
    }
}
