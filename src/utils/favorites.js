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
    if (!badge) return;
    const total = getFavorites().size;
    badge.textContent = total;
    badge.hidden = total === 0;
}
