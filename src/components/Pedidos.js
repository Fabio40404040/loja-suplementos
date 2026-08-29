import { isAuthenticated } from "../utils/storage.js";
import { apiRequest } from "../services/api.js";

const timelineLabels = ["Preparação", "Enviado", "Entregue"];

function formatCountdown(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
}

function timelineTemplate(order) {
    return timelineLabels.map((label, index) => {
        const classes = ["timeline-step"];
        if (index <= order.statusStep) classes.push("completed");
        if (index === order.statusStep) classes.push("current");

        return `<li class="${classes.join(" ")}"><span><i class="fa-solid fa-check"></i></span><small>${label}</small></li>`;
    }).join("");
}

function itemsTemplate(items = []) {
    if (items.length === 0) return "";
    return `<div class="pedido-produtos">${items.map((item) => `<span><strong>${item.quantity}x</strong> ${item.name}</span>`).join("")}</div>`;
}

function orderTemplate(order) {
    const nextLabel = order.statusStep === 0 ? "Próxima etapa em" : "Previsão de entrega em";
    const timer = order.nextStatusAt
        ? `<span class="status-timer" data-next-status="${order.nextStatusAt}" data-order-step="${order.statusStep}">${nextLabel} <strong>--:--</strong></span>`
        : '<span class="status-timer delivered"><i class="fa-solid fa-circle-check"></i> Pedido concluído</span>';

    return `<li class="pedido-item">
        <div class="pedido-header"><div><small>Pedido</small><strong>#${order.id}</strong></div><span class="status status-${order.statusStep}">${order.status}</span></div>
        <div class="pedido-meta"><span><i class="fa-regular fa-calendar"></i> ${order.data}</span><strong>${order.total}</strong></div>
        ${itemsTemplate(order.items)}
        <ol class="order-timeline">${timelineTemplate(order)}</ol>
        ${timer}
    </li>`;
}

export async function pedidos() {
    const list = document.querySelector("#pedidosList");
    if (!list) return;

    if (!isAuthenticated()) {
        window.location.href = "./login.html";
        return;
    }

    const emptyState = document.querySelector("#semPedidos");
    const loading = document.querySelector("#pedidosLoading");
    let refreshing = false;

    async function loadOrders() {
        if (refreshing) return;
        refreshing = true;

        try {
            const { response, data } = await apiRequest("/orders");
            if (!response.ok) throw new Error(data.error || "Não foi possível carregar os pedidos.");

            const orders = data.orders || [];
            list.innerHTML = orders.map(orderTemplate).join("");
            emptyState.style.display = orders.length === 0 ? "block" : "none";
        } catch (error) {
            list.innerHTML = `<li class="pedidos-error">${error.message}</li>`;
        } finally {
            if (loading) loading.hidden = true;
            refreshing = false;
            updateTimers();
        }
    }

    function updateTimers() {
        let needsRefresh = false;

        document.querySelectorAll("[data-next-status]").forEach((timer) => {
            const remainingTime = new Date(timer.dataset.nextStatus).getTime() - Date.now();
            const label = Number(timer.dataset.orderStep) === 0 ? "Próxima etapa em" : "Previsão de entrega em";
            timer.innerHTML = `${label} <strong>${formatCountdown(remainingTime)}</strong>`;
            if (remainingTime <= 0) needsRefresh = true;
        });

        if (needsRefresh) loadOrders();
    }

    await loadOrders();
    window.setInterval(updateTimers, 1000);
}
