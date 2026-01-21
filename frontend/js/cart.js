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

/* --- Updated addToCart in cart.js --- */
async function addToCart(gameId) {
  if (!isAuthenticated()) {
    // REPLACED ALERT
    showNotification('Please login to add games to cart', 'error');
    
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.style.display = 'block';
        requestAnimationFrame(() => {
            loginModal.classList.add('show');
            document.body.classList.add('modal-open');
        });
    }
    return;
  }

  try {
    await cartAPI.add(gameId);
    await loadCart();
    showNotification('Game added to cart!', 'success');
  } catch (error) {
    // REPLACED ALERT
    showNotification(error.message || 'Failed to add game', 'error');
  }
}

/* --- Updated removeFromCart in cart.js --- */
async function removeFromCart(gameId) {
  try {
    await cartAPI.remove(gameId);
    await loadCart();
    showNotification('Game removed', 'info');
  } catch (error) {
    // REPLACED ALERT
    showNotification(error.message || 'Failed to remove game', 'error');
  }
}

/* --- Updated clearCart in cart.js --- */
async function clearCart() {
  try {
    await cartAPI.clear();
    await loadCart();
    showNotification('Cart cleared', 'info');
  } catch (error) {
    // REPLACED ALERT
    showNotification(error.message || 'Failed to clear cart', 'error');
  }
}

// Update cart UI
function updateCartUI() {
  const cartCount = document.getElementById('cartCount');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');

  // Update cart count
  if (cartCount) {
    const count = isAuthenticated() ? cartItems.length : 0;
    cartCount.textContent = count;
    cartCount.style.display = count > 0 ? 'flex' : 'none';
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

/* --- Updated setupCartModal in cart.js --- */
function setupCartModal() {
  const cartIcon = document.getElementById('cartIcon');
  const cartModal = document.getElementById('cartModal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const cartItemsContainer = document.getElementById('cartItems');

  if (cartIcon) {
    cartIcon.addEventListener('click', (e) => {
      e.preventDefault();

      if (!isAuthenticated()) {
        if (cartItemsContainer) {
          cartItemsContainer.innerHTML = '<p class="empty-state">Please login to view your cart</p>';
        }
        // REPLACED ALERT
        showNotification('Please login to view your cart', 'error');
        
        const loginModal = document.getElementById('loginModal');
        if (loginModal) {
            loginModal.style.display = 'block';
            setTimeout(() => {
                loginModal.classList.add('show');
                document.body.classList.add('modal-open'); 
            }, 10);
        }
        return;
      }
      
      if (cartModal) {
          cartModal.style.display = 'block';
          requestAnimationFrame(() => {
              cartModal.classList.add('show');
              document.body.classList.add('modal-open');
          });
          loadCart(); 
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }
}

/* --- Updated handleCheckout in cart.js --- */
async function handleCheckout() {
    try {
        const response = await ordersAPI.checkout();
        
        if (response._id) {
            showNotification('Purchase successful!', 'success');
            
            cartItems = []; 
            updateCartUI(); 
            
            if (typeof checkAuthStatus === 'function') {
                await checkAuthStatus(); 
            }
            
            document.getElementById('cartModal').style.display = 'none';
            document.body.classList.remove('modal-open');
            document.querySelector('.modal.show')?.classList.remove('show');

            if (typeof loadLibrary === 'function') loadLibrary();
            if (typeof loadProfile === 'function') loadProfile();
            
        } else {
            // REPLACED ALERT
            showNotification(response.message || 'Checkout failed', 'error');
        }
    } catch (error) {
        // REPLACED ALERT
        showNotification(error.message || 'Checkout failed', 'error');
    }
}
