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
