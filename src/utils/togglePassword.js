
export function togglePasswordVisibility() {
    const toggleButtons = document.querySelectorAll(".toggle-password");

    // Se não houver nenhum botão na página, encerra sem erro.
    if (toggleButtons.length === 0) return;

    toggleButtons.forEach((toggleBtn) => {
        const wrapper = toggleBtn.closest(".password-wrapper");
        const passwordInput = wrapper?.querySelector("input");
        const icon = toggleBtn.querySelector("i");

        if (!passwordInput || !icon) return;

        toggleBtn.addEventListener("click", () => {
            const isPassword = passwordInput.type === "password";

            passwordInput.type = isPassword ? "text" : "password";

            icon.classList.toggle("fa-eye", !isPassword);
            icon.classList.toggle("fa-eye-slash", isPassword);

            toggleBtn.setAttribute(
                "aria-label",
                isPassword ? "Ocultar senha" : "Mostrar senha"
            );
        });
    });
}