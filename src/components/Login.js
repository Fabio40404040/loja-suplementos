import { loginUser } from "../services/AuthService.js";


export function login() {

    const form = document.querySelector("#loginForm");

    if (!form) return;

    const message = document.querySelector("#message");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = form.email.value.trim();
        const password = form.password.value;

        message.textContent = "";

        try {
            await loginUser(email, password);
            message.style.color = "green";
            message.textContent = "Login realizado com sucesso!";

            setTimeout(() => {
                document.location.href = "./index.html";
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
    const emailInput = document.querySelector("#email");
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
