import { resetPassword } from "../services/AuthService.js";

export function resetPasswordForm() {

    const form = document.querySelector("#resetForm");

    if (!form) return;

    const message = document.querySelector("#message");

    // Pega o token da URL: resetar-senha.html?token=abc123
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
        message.style.color = "red";
        message.textContent = "Link inválido ou incompleto.";
        form.querySelector("button[type=submit]").disabled = true;
        return;
    }

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const newPassword = form.newPassword.value;
        const newPasswordRepeat = form.newPasswordRepeat.value;

        message.textContent = "";

        if (newPassword !== newPasswordRepeat) {
            message.style.color = "red";
            message.textContent = "As senhas não coincidem.";
            return;
        }

        if (newPassword.length < 5) {
            message.style.color = "red";
            message.textContent = "A senha deve ter pelo menos 6 caracteres.";
            return;
        }

        try {

            await resetPassword(token, newPassword);

            message.style.color = "green";
            message.textContent = "Senha redefinida com sucesso! Redirecionando...";

            setTimeout(() => {
                window.location.href = "./login.html";
            }, 1500);

        } catch (error) {

            message.style.color = "red";
            message.textContent = error.message;

        }

    });

}