import { loginUser } from "../services/AuthService.js";

const REMEMBERED_EMAIL_KEY = "rememberedLoginEmail";

const allowedReturnPages = new Set([
    "pagamento.html",
    "meus-pedidos.html",
    "minha-conta.html",
    "rastreio.html"
]);

function pageAfterLogin() {
    const requestedPage = new URLSearchParams(window.location.search).get("return");
    return allowedReturnPages.has(requestedPage) ? `./${requestedPage}` : "./index.html";
}

export function login() {

    const form = document.querySelector("#loginForm");

    if (!form) return;

    const message = document.querySelector("#message");
    const emailInput = document.querySelector("#email");
    const rememberEmail = document.querySelector("#rememberEmail");
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);

    if (rememberedEmail && emailInput && rememberEmail) {
        emailInput.value = rememberedEmail;
        rememberEmail.checked = true;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = form.email.value.trim();
        const password = form.password.value;

        message.textContent = "";

        try {
            await loginUser(email, password);

            if (rememberEmail?.checked) {
                localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
            } else {
                localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }

            message.style.color = "green";
            message.textContent = "Login realizado com sucesso!";

            setTimeout(() => {
                document.location.href = pageAfterLogin();
            }, 1000);

        } catch (error) {
            console.error(error);
            message.style.color = "red";
            message.textContent = error.message;
        }

    });

    // Botão Cancelar: limpa o formulário e volta pra página principal
    const cancelBtn = document.querySelector("#cancelBtn");

    if (cancelBtn) {

        cancelBtn.addEventListener("click", () => {

            form.reset();
            message.textContent = "";

            window.location.href = "./index.html";

        });

    }

    // Botão X: limpa o campo de email
    const clearEmailBtn = document.querySelector("#clearEmail");

    if (emailInput && clearEmailBtn) {

        // Mostra o X só quando há texto digitado
        function toggleClearButton() {
            clearEmailBtn.classList.toggle("visible", emailInput.value.length > 0);
        }

        toggleClearButton(); // estado inicial (caso já venha preenchido)

        emailInput.addEventListener("input", toggleClearButton);

        clearEmailBtn.addEventListener("click", () => {
            emailInput.value = "";
            emailInput.focus();
            toggleClearButton();
        });

    }
}
