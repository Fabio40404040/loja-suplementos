/*  
* Quando você criar o Back-end, provavelmente só precisará alterar o 
* api.js, sem reescrever o formulário.
*/

import { getUser,isAuthenticated,logout} from "../utils/storage.js";

export function checkLogin() {

    const userName = document.querySelector("#userName");
    const dropdown = document.querySelector("#userDropdown");

    if (!userName || !dropdown) return;

    const user = getUser();

    if (!isAuthenticated() || !user) {

        userName.textContent = "Conectar-se";
        
        dropdown.innerHTML = `
            <a href="./login.html" id="loginLink">Login</a>
            <a href="./register.html" id="registerLink">Cadastro</a>
        `;
        return;

    }

    userName.textContent = `Olá, ${user.firstName}`;
    dropdown.innerHTML = `
        <a href="./minha-conta.html">Minha Conta</a>
        <a href="./meus-pedidos.html">Meus Pedidos</a>
        <a href="#" id="logout">Sair</a>
    `;
    document.querySelector("#logout").addEventListener("click",
        (event) =>{
        event.preventDefault();
        logout();
        location.reload();
    });

}
