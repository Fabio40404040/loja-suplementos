import { apiRequest } from "../services/api.js";
import { isAuthenticated } from "../utils/storage.js";

const steps = [
    { label: "Pedido recebido", icon: "fa-receipt" },
    { label: "Em transporte", icon: "fa-truck-fast" },
    { label: "Entregue", icon: "fa-house-circle-check" }
];

function statusTemplate(order) {
    return `
        <div class="tracking-order-head">
            <span><small>Pedido</small><strong>#${order.id}</strong></span>
            <span class="tracking-status">${order.status}</span>
        </div>
        <ol class="tracking-timeline" aria-label="Etapas do pedido">
            ${steps.map((step, index) => `
                <li class="${index <= order.statusStep ? "completed" : ""} ${index === order.statusStep ? "current" : ""}">
                    <span><i class="fa-solid ${step.icon}"></i></span>
                    <small>${step.label}</small>
                </li>`).join("")}
        </ol>
        <p class="tracking-update"><i class="fa-regular fa-clock"></i> Atualizado agora</p>`;
}

function messageTemplate(type, title, message, action = "") {
    const icon = type === "error" ? "fa-circle-exclamation" : "fa-user-lock";
    return `<div class="tracking-message ${type}"><i class="fa-solid ${icon}"></i><div><strong>${title}</strong><p>${message}</p>${action}</div></div>`;
}

export function initTracking() {
    const form = document.querySelector("#trackingForm");
    const input = document.querySelector("#trackingCode");
    const result = document.querySelector("#trackingResult");
    if (!form || !input || !result) return;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const orderId = Number(input.value.replace(/\D/g, ""));

        if (!orderId) {
            result.innerHTML = messageTemplate("error", "Número inválido", "Digite somente os números do seu pedido.");
            return;
        }

        if (!isAuthenticated()) {
            result.innerHTML = messageTemplate("auth", "Conecte-se para rastrear", "Assim protegemos os dados da sua compra.", '<a href="./login.html">Conectar-se <i class="fa-solid fa-arrow-right"></i></a>');
            return;
        }

        const submitButton = form.querySelector("button");
        submitButton.disabled = true;
        submitButton.innerHTML = 'Consultando <i class="fa-solid fa-spinner fa-spin"></i>';
        result.innerHTML = "";

        try {
            const { response, data } = await apiRequest("/orders");
            if (!response.ok) throw new Error(data.error || "Não foi possível consultar o pedido.");
            const order = (data.orders || []).find((item) => Number(item.id) === orderId);
            result.innerHTML = order
                ? statusTemplate(order)
                : messageTemplate("error", "Pedido não encontrado", "Confira o número ou verifique se ele pertence à conta conectada.");
        } catch (error) {
            result.innerHTML = messageTemplate("error", "Consulta indisponível", error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Rastrear pedido <i class="fa-solid fa-arrow-right"></i>';
        }
    });
}
