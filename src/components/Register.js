//====================== controla o formulário  =====================

import { registerUser } from "../services/AuthService.js";

export function register() {

    const form = document.querySelector("#registerForm");

    if (!form) return;

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = document.querySelector("#email").value.trim();
        const psw = document.querySelector("#psw").value;
        const pswRepeat = document.querySelector("#psw-repeat").value;

        const message = document.querySelector("#message");

        // Validação: campos vazios
        if (!email || !psw || !pswRepeat) {
            if (message) message.textContent = "Preencha todos os campos.";
            return;
        }

        // Validação: senhas diferentes
        if (psw !== pswRepeat) {
            if (message) message.textContent = "As senhas não coincidem.";
            return;
        }

        // Validação: senha curta
        if (psw.length < 6) {
            if (message) message.textContent = "A senha deve ter pelo menos 6 caracteres.";
            return;
        }

        try {

            if (message) {
                message.style.color = "";
                message.textContent = "Criando sua conta...";
            }

            await registerUser(email, psw);

            // Cadastro feito, redireciona pro login (ou index, se preferir)
            window.location.href = "./index.html";

        } catch (err) {

            if (message) {
                message.style.color = "red";
                message.textContent = err.message;
            }

        }

    });

}
