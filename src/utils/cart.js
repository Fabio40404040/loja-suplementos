const CART_KEY = "cart";

// Obtém o carrinho salvo
export function getCart() {

    const cart = localStorage.getItem(CART_KEY);

    return cart ? JSON.parse(cart) : [];

}

// Salva o carrinho
function saveCart(cart) {

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

}

// Adiciona um produto (ou aumenta a quantidade se já existir)
export function addToCart(product) {

    const cart = getCart();

    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });

    }

    saveCart(cart);

    return cart;

}

// Remove um produto do carrinho
export function removeFromCart(productId) {

    const cart = getCart().filter((item) => item.id !== productId);

    saveCart(cart);

    return cart;

}

// Atualiza a quantidade de um produto (mínimo 1)
export function updateQuantity(productId, quantity) {

    const cart = getCart();

    const item = cart.find((item) => item.id === productId);

    if (item) {

        item.quantity = Math.max(1, quantity);

    }

    saveCart(cart);

    return cart;

}

// Esvazia o carrinho
export function clearCart() {

    localStorage.removeItem(CART_KEY);

}

// Total de itens (soma das quantidades) — usado no ícone do carrinho
export function getCartCount() {

    return getCart().reduce((total, item) => total + item.quantity, 0);

}

// Valor total do carrinho
export function getCartTotal() {

    return getCart().reduce((total, item) => total + (item.price * item.quantity), 0);

}