import { createOrder } from "../services/OrderService.js";
import { getToken, isAuthenticated } from "../utils/storage.js";
import { clearCart, getCart, getCartTotal } from "../utils/cart.js";
import { updateCartBadge } from "./Cart.js";
import QRCode from "qrcode";

function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(value);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function initPayment() {
    const layout = document.querySelector("#paymentLayout");
    if (!layout) return;

    const cart = getCart();
    const emptyState = document.querySelector("#paymentEmpty");
    const successState = document.querySelector("#paymentSuccess");
    const paymentItems = document.querySelector("#paymentItems");
    const subtotal = document.querySelector("#paymentSubtotal");
    const total = document.querySelector("#paymentTotal");
    const message = document.querySelector("#paymentMessage");
    const form = document.querySelector("#paymentForm");
    const submitButton = document.querySelector("#simulatePaymentBtn");
    const cardSimulation = document.querySelector("#cardSimulation");
    const pixSimulation = document.querySelector("#pixSimulation");
    const pixQrCode = document.querySelector("#pixQrCode");
    const pixCopyCode = document.querySelector("#pixCopyCode");
    const copyPixCode = document.querySelector("#copyPixCode");
    const pixCopyFeedback = document.querySelector("#pixCopyFeedback");

    if (cart.length === 0) {
        layout.hidden = true;
        emptyState.hidden = false;
        return;
    }

    paymentItems.innerHTML = cart.map((item) => `
        <div class="payment-item">
            <img src="${escapeHtml(item.image)}" alt="" />
            <span><strong>${escapeHtml(item.name)}</strong><small>${item.quantity}x ${formatCurrency(item.price)}</small></span>
            <b>${formatCurrency(item.price * item.quantity)}</b>
        </div>
    `).join("");

    const cartTotal = getCartTotal();
    subtotal.textContent = formatCurrency(cartTotal);
    total.textContent = formatCurrency(cartTotal);
    const defaultButtonLabel = `Finalizar compra simulada · ${formatCurrency(cartTotal)}`;
    submitButton.querySelector("span").textContent = defaultButtonLabel;

    const pixPayload = `PIX DE DEMONSTRACAO - FORJA NUTRITION - TOTAL ${formatCurrency(cartTotal)} - SEM VALOR FINANCEIRO`;
    pixCopyCode.value = pixPayload;
    let pixQrRendered = false;

    async function renderPixQrCode() {
        if (pixQrRendered) return;

        try {
            await QRCode.toCanvas(pixQrCode, pixPayload, {
                width: 220,
                margin: 2,
                errorCorrectionLevel: "M",
                color: { dark: "#11160f", light: "#ffffff" }
            });
            pixQrRendered = true;
        } catch {
            pixCopyFeedback.textContent = "Não foi possível gerar o QR Code. Use o código fictício ao lado.";
        }
    }

    copyPixCode.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(pixPayload);
            pixCopyFeedback.textContent = "Código fictício copiado! Nenhum pagamento será realizado.";
        } catch {
            pixCopyFeedback.textContent = "Não foi possível copiar. Selecione o texto manualmente.";
            pixCopyCode.select();
        }
    });

    const cardFields = [...cardSimulation.querySelectorAll("input")];
    const cardNumber = document.querySelector("#cardNumber");
    const cardExpiry = document.querySelector("#cardExpiry");
    const cardCvv = document.querySelector("#cardCvv");

    cardNumber.addEventListener("input", () => {
        cardNumber.value = cardNumber.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
    });

    cardExpiry.addEventListener("input", () => {
        const digits = cardExpiry.value.replace(/\D/g, "").slice(0, 4);
        cardExpiry.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    });

    cardCvv.addEventListener("input", () => {
        cardCvv.value = cardCvv.value.replace(/\D/g, "").slice(0, 3);
    });

    document.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
        input.addEventListener("change", () => {
            document.querySelectorAll(".payment-method").forEach((method) => {
                method.classList.toggle("active", method.contains(input));
            });

            const cardSelected = input.value === "card";
            cardSimulation.hidden = !cardSelected;
            pixSimulation.hidden = cardSelected;
            cardFields.forEach((field) => { field.disabled = !cardSelected; });
            if (!cardSelected) renderPixQrCode();
            message.textContent = "";
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const hadSavedSession = Boolean(getToken());
        if (!isAuthenticated()) {
            message.className = "payment-message error";
            message.innerHTML = hadSavedSession
                ? 'Sua sessão expirou. <a href="./login.html?return=pagamento.html">Entrar novamente</a>'
                : 'Entre na sua conta para concluir a simulação. <a href="./login.html?return=pagamento.html">Fazer login</a>';
            return;
        }

        const selectedMethod = form.elements.paymentMethod.value;
        if (selectedMethod === "card") {
            if (!form.checkValidity()) {
                message.className = "payment-message error";
                message.textContent = "Preencha todos os dados fictícios do cartão para continuar.";
                return;
            }

            const normalizedCardNumber = cardNumber.value.replace(/\D/g, "");
            const validTestData = normalizedCardNumber === "4242424242424242"
                && cardExpiry.value === "12/30"
                && cardCvv.value === "123";

            if (!validTestData) {
                message.className = "payment-message error";
                message.textContent = "Use os dados de teste indicados: cartão final 4242, validade 12/30 e CVV 123.";
                return;
            }
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Processando simulação...</span><i class="fa-solid fa-spinner fa-spin"></i>';
        message.className = "payment-message";
        message.textContent = "Validando o ambiente demonstrativo. Nenhuma cobrança será feita.";

        try {
            const { order } = await createOrder(cart);

            form.reset();
            clearCart();
            updateCartBadge();
            layout.hidden = true;
            document.querySelector(".demo-payment-notice").hidden = true;
            document.querySelector("#successOrderId").textContent = `#${order.id}`;
            successState.hidden = false;
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (error) {
            message.className = "payment-message error";
            if (error.message.includes("sessão expirou")) {
                message.innerHTML = 'Sua sessão expirou. <a href="./login.html?return=pagamento.html">Entrar novamente</a>';
            } else {
                message.textContent = error.message;
            }
            submitButton.disabled = false;
            submitButton.innerHTML = `<span>${defaultButtonLabel}</span><i class="fa-solid fa-lock"></i>`;
        }
    });
}
