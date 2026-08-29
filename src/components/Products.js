import { products } from "../data/products.js";
import { addToCart } from "../utils/cart.js";
import { updateCartBadge } from "./Cart.js";
import { getFavorites, toggleFavorite, updateFavoritesBadge } from "../utils/favorites.js";

let activeCategory = "Todos";
let searchTerm = "";

function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function formatPrice(price) {
    return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function filteredProducts() {
    return products.filter((product) => {
        const matchesCategory = activeCategory === "Todos" || product.category === activeCategory;
        const searchableText = normalize(`${product.name} ${product.category}`);
        return matchesCategory && searchableText.includes(normalize(searchTerm));
    });
}

function productTemplate(product) {
    const badgeClass = product.badge?.startsWith("-") ? " sale" : "";
    const isFavorite = getFavorites().has(product.id);
    return `
        <article class="product-card">
            <div class="product-media">
                ${product.badge ? `<span class="product-badge${badgeClass}">${product.badge}</span>` : ""}
                <button class="favorite-btn${isFavorite ? " active" : ""}" type="button" data-id="${product.id}" aria-label="${isFavorite ? "Remover" : "Adicionar"} ${product.name} ${isFavorite ? "dos" : "aos"} favoritos" aria-pressed="${isFavorite}"><i class="fa-${isFavorite ? "solid" : "regular"} fa-heart"></i></button>
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

function paintProducts() {
    const grid = document.querySelector("#productsGrid");
    if (!grid) return;

    const visibleProducts = filteredProducts();
    const emptyState = document.querySelector("#emptyProducts");
    const count = document.querySelector("#productsCount");
    const title = document.querySelector("#productsTitle");

    grid.innerHTML = visibleProducts.map(productTemplate).join("");
    grid.hidden = visibleProducts.length === 0;
    if (emptyState) emptyState.hidden = visibleProducts.length !== 0;
    if (count) count.textContent = `${visibleProducts.length} ${visibleProducts.length === 1 ? "produto" : "produtos"}`;
    if (title) title.textContent = activeCategory === "Todos" ? "Produtos em destaque" : activeCategory;
    if (emptyState) {
        const emptyTitle = emptyState.querySelector("h3");
        const emptyText = emptyState.querySelector("p");
        if (emptyTitle) emptyTitle.textContent = "Nenhum produto encontrado";
        if (emptyText) emptyText.textContent = "Tente outro termo ou veja todos os produtos.";
    }

    document.querySelectorAll(".filter-chip").forEach((chip) => {
        chip.classList.toggle("active", chip.dataset.category === activeCategory);
    });

    grid.querySelectorAll(".add-to-cart-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const product = products.find((item) => item.id === Number(button.dataset.id));
            if (!product) return;
            addToCart(product);
            updateCartBadge();
            button.classList.add("added");
            button.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => {
                button.classList.remove("added");
                button.innerHTML = '<i class="fa-solid fa-plus"></i>';
            }, 1200);
        });
    });

    grid.querySelectorAll(".favorite-btn").forEach((button) => {
        button.addEventListener("click", () => {
            const productId = Number(button.dataset.id);
            toggleFavorite(productId);
            paintProducts();
        });
    });
}

function selectCategory(category, shouldScroll = true) {
    activeCategory = category || "Todos";
    searchTerm = "";
    const search = document.querySelector("#search");
    const results = document.querySelector("#search-results");
    if (search) search.value = "";
    if (results) results.innerHTML = "";
    paintProducts();
    if (shouldScroll) document.querySelector("#produtos")?.scrollIntoView({ behavior: "smooth" });
}

function initializeFilters() {
    document.querySelectorAll("[data-category]").forEach((control) => {
        control.addEventListener("click", (event) => {
            event.preventDefault();
            selectCategory(control.dataset.category);
        });
    });

    const input = document.querySelector("#search");
    const results = document.querySelector("#search-results");
    if (!input || !results) return;

    input.addEventListener("input", () => {
        searchTerm = input.value;
        activeCategory = "Todos";
        paintProducts();

        const matches = products.filter((product) => normalize(`${product.name} ${product.category}`).includes(normalize(searchTerm))).slice(0, 5);
        results.innerHTML = searchTerm.trim()
            ? matches.map((product) => `<li><button type="button" data-product-id="${product.id}">${product.name}</button></li>`).join("")
            : "";

        results.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", () => {
                const product = products.find((item) => item.id === Number(button.dataset.productId));
                if (!product) return;
                input.value = product.name;
                searchTerm = product.name;
                results.innerHTML = "";
                paintProducts();
                document.dispatchEvent(new CustomEvent("forja:close-menu"));
                document.querySelector("#produtos")?.scrollIntoView({ behavior: "smooth" });
            });
        });
    });

    input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;

        event.preventDefault();
        const firstResult = results.querySelector("button");
        if (firstResult) {
            firstResult.click();
            return;
        }

        if (searchTerm.trim()) {
            document.dispatchEvent(new CustomEvent("forja:close-menu"));
            document.querySelector("#produtos")?.scrollIntoView({ behavior: "smooth" });
        }
    });

    document.addEventListener("click", (event) => {
        if (!event.target.closest(".search-container")) results.innerHTML = "";
    });

}

function initializeNewsletter() {
    const form = document.querySelector("#newsletterForm");
    const message = document.querySelector("#newsletterMessage");
    if (!form || !message) return;

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        message.textContent = "Pronto! Você agora faz parte do time da Forja. ✓";
        message.style.color = "#536500";
        form.reset();
    });
}

export function renderProducts() {
    updateFavoritesBadge();
    if (!document.querySelector("#productsGrid")) return;
    paintProducts();
    initializeFilters();
    initializeNewsletter();
}
