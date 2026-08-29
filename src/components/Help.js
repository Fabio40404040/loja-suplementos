const helpModules = {
    central: {
        eyebrow: "Pedidos e pagamentos",
        title: "Central de ajuda",
        intro: "As respostas essenciais para comprar com tranquilidade na Forja.",
        questions: [
            ["Como acompanho meu pedido?", "Entre em Meus pedidos para ver suas compras ou use a página de rastreio com o número do pedido."],
            ["Quais formas de pagamento são aceitas?", "A loja apresenta as opções disponíveis durante a finalização da compra, antes da confirmação do pedido."],
            ["Posso alterar um pedido confirmado?", "Entre em contato o quanto antes. Se o pedido ainda não tiver sido separado, nosso time verificará as possibilidades."],
            ["Como recupero o acesso à minha conta?", "Na tela de login, escolha Esqueci minha senha e siga as instruções enviadas para o e-mail cadastrado."]
        ]
    },
    envios: {
        eyebrow: "Do estoque até você",
        title: "Envios e entregas",
        intro: "Consulte informações sobre preparação, prazo e acompanhamento da entrega.",
        questions: [
            ["Quando meu pedido será enviado?", "Após a confirmação do pagamento, o pedido entra em separação. O prazo de preparação é contabilizado antes do transporte."],
            ["Como rastreio a entrega?", "Acesse Rastreio no menu da loja e informe o número do pedido. Você também pode acompanhar pela área Meus pedidos."],
            ["O prazo de entrega pode mudar?", "O prazo considera o CEP, a modalidade escolhida e dias úteis. Eventos externos ou tentativas sem sucesso podem alterá-lo."],
            ["O que faço se o endereço estiver errado?", "Fale com o atendimento imediatamente. Depois que o pacote é enviado, pode não ser possível modificar o endereço."]
        ]
    },
    trocas: {
        eyebrow: "Compra sem complicação",
        title: "Trocas e devoluções",
        intro: "Saiba como solicitar uma análise e preparar o produto para devolução.",
        questions: [
            ["Como solicito uma troca ou devolução?", "Envie um e-mail ao atendimento com o número do pedido, o motivo da solicitação e, se necessário, fotos do produto."],
            ["Recebi um item diferente ou avariado. E agora?", "Não descarte a embalagem. Fotografe o produto e a caixa recebida e fale com nosso atendimento para análise."],
            ["O produto precisa estar lacrado?", "Para devoluções por arrependimento, o produto deve estar sem sinais de uso, com lacre e embalagem original preservados."],
            ["Como funciona o reembolso?", "Após o recebimento e a conferência do item, o estorno é solicitado pelo mesmo meio usado no pagamento. O prazo final depende da instituição financeira."]
        ]
    }
};

function getActiveModule() {
    const key = window.location.hash.replace("#", "");
    return helpModules[key] ? key : "central";
}

function renderHelpModule(key) {
    const content = document.querySelector("#helpContent");
    if (!content) return;

    const module = helpModules[key];
    content.innerHTML = `
        <div class="help-content-heading">
            <span class="kicker">${module.eyebrow}</span>
            <h2>${module.title}</h2>
            <p>${module.intro}</p>
        </div>
        <div class="help-questions">
            ${module.questions.map(([question, answer], index) => `
                <details ${index === 0 ? "open" : ""}>
                    <summary>${question}<i class="fa-solid fa-plus"></i></summary>
                    <p>${answer}</p>
                </details>
            `).join("")}
        </div>`;

    document.querySelectorAll("[data-help-tab]").forEach((tab) => {
        const active = tab.dataset.helpTab === key;
        tab.classList.toggle("active", active);
        if (active) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
    });
}

export function initHelp() {
    if (!document.querySelector(".help-page")) return;

    renderHelpModule(getActiveModule());
    window.addEventListener("hashchange", () => renderHelpModule(getActiveModule()));

    document.querySelector("#helpContent")?.addEventListener("toggle", (event) => {
        if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
        document.querySelectorAll(".help-questions details[open]").forEach((item) => {
            if (item !== event.target) item.open = false;
        });
    }, true);
}
