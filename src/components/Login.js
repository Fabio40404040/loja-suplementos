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

function credentialManagerAvailable() {
    return "credentials" in navigator && "PasswordCredential" in window;
}

async function fillCredentialFromBrowser(emailInput, passwordInput, rememberEmail, mediation = "optional") {
    if (!credentialManagerAvailable()) return false;

    try {
        const credential = await navigator.credentials.get({
            password: true,
            mediation
        });

        if (credential?.type !== "password") return false;

        emailInput.value = credential.id;
        passwordInput.value = credential.password;
        rememberEmail.checked = true;
        emailInput.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
    } catch {
        // O preenchimento padrão do navegador continua disponível como alternativa.
        return false;
    }
}

async function offerCredentialStorage(email, password) {
    if (!credentialManagerAvailable()) return;

    try {
        const credential = new PasswordCredential({
            id: email,
            name: email,
            password
        });
        await navigator.credentials.store(credential);
    } catch {
        // O navegador pode recusar ou não oferecer o salvamento; o login segue normalmente.
    }
}

export function login() {

    const form = document.querySelector("#loginForm");

    if (!form) return;

    const message = document.querySelector("#message");
    const submitButton = form.querySelector('button[type="submit"]');
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");
    const rememberEmail = document.querySelector("#rememberEmail");
    const fillSavedPassword = document.querySelector("#fillSavedPassword");
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
        submitButton.disabled = true;
        submitButton.textContent = "Entrando...";

        try {
            await loginUser(email, password);

            if (rememberEmail?.checked) {
                localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
                await offerCredentialStorage(email, password);
            } else {
                localStorage.removeItem(REMEMBERED_EMAIL_KEY);
            }

            message.style.color = "green";
            message.textContent = "Login realizado com sucesso!";
            document.location.href = pageAfterLogin();

        } catch (error) {
            console.error(error);
            message.style.color = "red";
            message.textContent = error.message;
            submitButton.disabled = false;
            submitButton.textContent = "Login";
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

    if (emailInput && passwordInput && rememberEmail) {
        fillCredentialFromBrowser(emailInput, passwordInput, rememberEmail);

        fillSavedPassword?.addEventListener("click", async () => {
            message.textContent = "";
            const filled = await fillCredentialFromBrowser(
                emailInput,
                passwordInput,
                rememberEmail,
                "required"
            );

            if (!filled) {
                message.style.color = "#b42318";
                message.textContent = "Nenhuma senha salva foi encontrada neste navegador.";
            }
        });
    }
}
