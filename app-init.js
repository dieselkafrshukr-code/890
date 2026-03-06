document.addEventListener('DOMContentLoaded', () => {
    // Announcement Close
    const closeAnnouncementBtn = document.getElementById('close-announcement');
    if (closeAnnouncementBtn) {
        closeAnnouncementBtn.addEventListener('click', () => {
            if (typeof window.closeAnnouncement === 'function') window.closeAnnouncement();
        });
    }

    // Wishlist Header Toggle
    const wishlistBtn = document.getElementById('wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', () => {
            if (typeof window.toggleWishlistModal === 'function') window.toggleWishlistModal();
        });
    }

    // User Profile / Login Icon
    const googleLoginBtn = document.getElementById('google-login-btn');
    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', () => {
            if (typeof window.handleUserIconClick === 'function') window.handleUserIconClick();
        });
    }

    // Product Search Input
    const productSearchInput = document.getElementById('product-search');
    if (productSearchInput) {
        productSearchInput.addEventListener('input', (e) => {
            if (typeof window.filterProducts === 'function') window.filterProducts(e.target.value);
        });
    }

    // Clear Search Button
    const clearSearchBtn = document.querySelector('.clear-search-btn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (typeof window.clearSearch === 'function') window.clearSearch();
        });
    }

    // Cart Close Button
    const closeCartBtn = document.querySelector('.close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            if (typeof window.toggleCart === 'function') window.toggleCart();
        });
    }

    // Confirm Order Button
    const confirmOrderBtn = document.getElementById('confirm-order-btn');
    if (confirmOrderBtn) {
        confirmOrderBtn.addEventListener('click', () => {
            if (typeof window.confirmOrder === 'function') window.confirmOrder();
        });
    }

    // Product Modal Close
    const closeProductModalBtn = document.querySelector('.close-detail');
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
            if (typeof window.closeProductModal === 'function') window.closeProductModal();
        });
    }

    // Wishlist Toggle inside modal
    const wishlistToggleBtn = document.getElementById('wishlist-toggle-btn');
    if (wishlistToggleBtn) {
        wishlistToggleBtn.addEventListener('click', () => {
            if (typeof window.toggleWishlist === 'function') window.toggleWishlist();
        });
    }

    // Close Wishlist Modal
    const closeWishlistBtn = document.querySelector('#wishlist-modal .close-cart');
    if (closeWishlistBtn) {
        closeWishlistBtn.addEventListener('click', () => {
            if (typeof window.toggleWishlistModal === 'function') window.toggleWishlistModal();
        });
    }
});
