import { products } from "../data/products.js";
import { addToCart } from "../utils/cart.js";
import { getFavorites, toggleFavorite, updateFavoritesBadge } from "../utils/favorites.js";
import { updateCartBadge } from "./Cart.js";

function formatPrice(price) {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function productTemplate(product) {
    const badgeClass = product.badge?.startsWith("-") ? " sale" : "";
    return `
        <article class="product-card">
            <div class="product-media">
                ${product.badge ? `<span class="product-badge${badgeClass}">${product.badge}</span>` : ""}
                <button class="favorite-btn active" type="button" data-id="${product.id}" aria-label="Remover ${product.name} dos favoritos" aria-pressed="true"><i class="fa-solid fa-heart"></i></button>
                <img src="${product.image}" alt="${product.name}" loading="lazy">
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h3>${product.name}</h3>
                <div class="product-rating" aria-label="Avaliação ${product.rating} de 5"><span aria-hidden="true">★★★★★</span><span>${product.rating.toFixed(1)}</span></div>
                <div class="product-price-row">
                    <p class="product-price">${formatPrice(product.price)}<small>ou 3x sem juros</small></p>
                    <button class="add-to-cart-btn" type="button" data-id="${product.id}" aria-label="Adicionar ${product.name} ao carrinho"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>
        </article>`;
}

export function renderFavoritesPage() {
    const grid = document.querySelector("#favoritesGrid");
    if (!grid) return;

    const empty = document.querySelector("#favoritesEmpty");
    const count = document.querySelector("#favoritesCount");

    function render() {
        const favoriteIds = getFavorites();
        const favorites = products.filter((product) => favoriteIds.has(product.id));

        grid.innerHTML = favorites.map(productTemplate).join("");
        grid.hidden = favorites.length === 0;
        if (empty) empty.hidden = favorites.length !== 0;
        if (count) count.textContent = `${favorites.length} ${favorites.length === 1 ? "produto salvo" : "produtos salvos"}`;
        updateFavoritesBadge();

        grid.querySelectorAll(".favorite-btn").forEach((button) => {
            button.addEventListener("click", () => {
                toggleFavorite(Number(button.dataset.id));
                render();
            });
        });

        grid.querySelectorAll(".add-to-cart-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const product = products.find((item) => item.id === Number(button.dataset.id));
                if (!product) return;
                addToCart(product);
                updateCartBadge();
                button.classList.add("added");
                button.innerHTML = '<i class="fa-solid fa-check"></i>';
                window.setTimeout(() => {
                    button.classList.remove("added");
                    button.innerHTML = '<i class="fa-solid fa-plus"></i>';
                }, 1200);
            });
        });
    }

    render();
}
