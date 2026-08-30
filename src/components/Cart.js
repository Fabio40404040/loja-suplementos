import { isAuthenticated } from "../utils/storage.js";
import {
    getCart,
    removeFromCart,
    updateQuantity,
    getCartCount,
    getCartTotal
} from "../utils/cart.js";


// Atualiza o número no ícone do carrinho (roda em todas as páginas)
export function updateCartBadge() {

    const badge = document.querySelector("#cartBadge");
    const hamburgerBadge = document.querySelector("#hamburgerCartBadge");

    if (!badge && !hamburgerBadge) return;

    const count = getCartCount();

    if (badge) {
        badge.textContent = count;
        badge.hidden = count === 0;
    }

    if (hamburgerBadge) {
        const counter = hamburgerBadge.closest(".hamburger-stat");
        const counters = hamburgerBadge.closest(".hamburger-counts");
        hamburgerBadge.textContent = count;
        counter.hidden = count === 0;
        counters.hidden = !counters.querySelector(".hamburger-stat:not([hidden])");
    }

}

// Renderiza a página carrinho.html
export function renderCartPage() {

    const list = document.querySelector("#cartList");

    if (!list) return;

    const emptyMsg = document.querySelector("#cartEmpty");
    const totalEl = document.querySelector("#cartTotal");
    const summary = document.querySelector("#cartSummary");

    function render() {

        const cart = getCart();

        if (cart.length === 0) {

            list.innerHTML = "";
            emptyMsg.style.display = "block";
            summary.style.display = "none";

            return;

        }

        emptyMsg.style.display = "none";
        summary.style.display = "block";

        list.innerHTML = cart.map((item) => `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p class="cart-item-price">R$ ${item.price.toFixed(2).replace(".", ",")}</p>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn minus" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn plus" data-id="${item.id}">+</button>
                </div>
                <button class="remove-btn" data-id="${item.id}">Remover</button>
            </div>
        `).join("");

        totalEl.textContent = `R$ ${getCartTotal().toFixed(2).replace(".", ",")}`;

        // Botões de quantidade
        list.querySelectorAll(".qty-btn").forEach((button) => {

            button.addEventListener("click", () => {

                const id = Number(button.dataset.id);
                const cart = getCart();
                const item = cart.find((i) => i.id === id);

                const newQty = button.classList.contains("plus")
                    ? item.quantity + 1
                    : item.quantity - 1;

                if (newQty < 1) {
                    removeFromCart(id);
                } else {
                    updateQuantity(id, newQty);
                }

                updateCartBadge();
                render();

            });

        });

        // Botões de remover
        list.querySelectorAll(".remove-btn").forEach((button) => {

            button.addEventListener("click", () => {

                const id = Number(button.dataset.id);

                removeFromCart(id);

                updateCartBadge();
                render();

            });

        });

    }

    render();

    // Encaminha para o checkout demonstrativo.
    const checkoutBtn = document.querySelector("#checkoutBtn");

    if (checkoutBtn) {

        checkoutBtn.addEventListener("click", () => {

            const cart = getCart();

            if (cart.length === 0) return;

            const checkoutMessage = document.querySelector("#checkoutMessage");

            checkoutMessage.textContent = "";
            checkoutMessage.className = "checkout-message";

            if (!isAuthenticated()) {
                checkoutMessage.innerHTML = 'Entre na sua conta para continuar. <a href="./login.html">Fazer login</a>';
                checkoutMessage.classList.add("error");
                return;
            }

            window.location.href = "./pagamento.html";

        });

    }
}

// Atualiza o badge quando a página é restaurada do cache do navegador
// (ex: usuário clicou em "Voltar" depois de finalizar a compra)
window.addEventListener("pageshow", (event) => {

    updateCartBadge();

});
