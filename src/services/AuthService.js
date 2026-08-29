import { apiRequest } from "./api.js";
import {saveToken,saveUser,logout as clearStorage} from "../utils/storage.js";


export async function loginUser(email, password) {

    const { response, data } = await apiRequest("/login",{
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });
    // Se o backend retornar erro
    if (!response.ok) {
        throw new Error(data.error || data.message || "E-mail ou senha inválidos.");

    }
    // Salva o token recebido do backend
    saveToken(data.token);
    // Salva os dados do usuário
    saveUser(data.user);
    return data;
}

export function logoutUser() {
    clearStorage();
}

//  ================== (chamada de API — espelha o loginUser) ===================

export async function registerUser(email, password) {

    const { response, data } = await apiRequest("/register",{
        method: "POST",
        body: JSON.stringify({
            email,
            password
        })
    });
    // Se o backend retornar erro (ex: email já cadastrado)
    if (!response.ok) {
        throw new Error(
            data.error || "Não foi possível criar a conta."
        );
    }
    // Salva o token recebido do backend
    saveToken(data.token);
    // Salva os dados do usuário
    saveUser(data.user);
    return data;
}

export async function forgotPassword(email) {

    const { response, data } = await apiRequest("/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email })
    });

    if (!response.ok) {
        throw new Error(data.error || "Não foi possível processar a solicitação.");
    }

    return data;

}

export async function resetPassword(token, newPassword) {

    const { response, data } = await apiRequest("/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword })
    });

    if (!response.ok) {
        throw new Error(data.error || "Não foi possível redefinir a senha.");
    }

    return data;

}
