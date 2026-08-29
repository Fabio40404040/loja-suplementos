import { forgotPassword } from "../services/AuthService.js";

export function forgotPasswordForm() {

    const form = document.querySelector("#forgotForm");

    if (!form) return;

    const message = document.querySelector("#message");

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = form.email.value.trim();

        message.textContent = "";

        try {

            const data = await forgotPassword(email);

            message.style.color = "green";
            message.textContent = data.message;

            // SIMULADO: mostra o link direto na tela, já que não há envio de e-mail real
            if (data.resetLink) {

                const linkEl = document.createElement("a");
                linkEl.href = data.resetLink;
                linkEl.textContent = "Clique aqui para redefinir sua senha (simulação)";
                linkEl.style.display = "block";
                linkEl.style.marginTop = "10px";
                linkEl.style.textAlign = "center";

                message.after(linkEl);

            }

        } catch (error) {

            message.style.color = "red";
            message.textContent = error.message;

        }

    });

    // Botão X do email (mesmo padrão do login)
    const emailInput = document.querySelector("#email");
    const clearEmailBtn = document.querySelector("#clearEmail");

    if (emailInput && clearEmailBtn) {

        function toggleClearButton() {
            clearEmailBtn.classList.toggle("visible", emailInput.value.length > 0);
        }

        emailInput.addEventListener("input", toggleClearButton);

        clearEmailBtn.addEventListener("click", () => {
            emailInput.value = "";
            emailInput.focus();
            toggleClearButton();
        });

    }

}