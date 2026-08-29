import { getUser, isAuthenticated, logout } from "../utils/storage.js";

export function conta() {

    const container = document.querySelector("#firstName");

    // Só roda na página Minha Conta
    if (!container) return;

    // Protege a página: se não estiver logado, manda pro login
    if (!isAuthenticated()) {
        window.location.href = "./login.html";
        return;
    }

    const user = getUser();

    document.querySelector("#firstName").textContent = user.firstName;
    document.querySelector("#email").textContent = user.email;

    const logoutBtn = document.querySelector("#logoutBtn");

    logoutBtn.addEventListener("click", () => {
        logout();
        window.location.href = "./index.html";
    });

}