const FAVORITES_KEY = "forja-favorites";

export function getFavorites() {
    try {
        const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
        return new Set(saved.map(Number).filter(Number.isFinite));
    } catch {
        return new Set();
    }
}

export function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

export function toggleFavorite(productId) {
    const favorites = getFavorites();
    favorites.has(productId) ? favorites.delete(productId) : favorites.add(productId);
    saveFavorites(favorites);
    updateFavoritesBadge();
    return favorites.has(productId);
}

export function updateFavoritesBadge() {
    const badge = document.querySelector("#favoritesBadge");
    const hamburgerBadge = document.querySelector("#hamburgerFavoritesBadge");
    if (!badge && !hamburgerBadge) return;
    const total = getFavorites().size;

    if (badge) {
        badge.textContent = total;
        badge.hidden = total === 0;
    }

    if (hamburgerBadge) {
        const counter = hamburgerBadge.closest(".hamburger-stat");
        const counters = hamburgerBadge.closest(".hamburger-counts");
        hamburgerBadge.textContent = total;
        counter.hidden = total === 0;
        counters.hidden = !counters.querySelector(".hamburger-stat:not([hidden])");
    }
}
