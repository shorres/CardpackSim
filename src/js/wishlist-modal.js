// Wishlist modal wiring.
// Previously this lived in an inline <script> block in index.html with onclick="..."
// attributes. Both are blocked by the Content-Security-Policy, so the handlers are
// bound here instead.

function closeWishlistModal() {
    const modal = document.getElementById('wishlist-modal');
    if (modal) modal.classList.add('hidden');
}

function addToWishlistFromModal() {
    const setId = document.getElementById('wishlist-set-select')?.value;
    const cardName = document.getElementById('wishlist-card-input')?.value;
    const maxPrice = document.getElementById('wishlist-price-input')?.value;
    const isFoil = document.getElementById('wishlist-foil-checkbox')?.checked;

    if (!setId || !cardName) {
        if (window.uiManager) {
            window.uiManager.showNotification('Please select a set and enter a card name', 'error');
        }
        return;
    }

    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : null;
    if (maxPrice && isNaN(maxPriceNum)) {
        if (window.uiManager) {
            window.uiManager.showNotification('Invalid price entered', 'error');
        }
        return;
    }

    if (window.gameEngine) {
        const result = window.gameEngine.marketEngine.addToWishlist(setId, cardName, maxPriceNum, isFoil, 'medium');
        if (window.uiManager) {
            window.uiManager.showNotification(result.message, result.success ? 'success' : 'error');
            if (result.success) {
                window.uiManager.renderWishlist();
                window.uiManager.renderMarketListings();
            }
        }
    }

    closeWishlistModal();

    // Clear form
    document.getElementById('wishlist-card-input').value = '';
    document.getElementById('wishlist-price-input').value = '';
    document.getElementById('wishlist-foil-checkbox').checked = false;
    document.getElementById('wishlist-set-select').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('wishlist-modal-close')?.addEventListener('click', closeWishlistModal);
    document.getElementById('wishlist-cancel-btn')?.addEventListener('click', closeWishlistModal);
    document.getElementById('wishlist-add-btn')?.addEventListener('click', addToWishlistFromModal);
});

window.closeWishlistModal = closeWishlistModal;
window.addToWishlistFromModal = addToWishlistFromModal;
