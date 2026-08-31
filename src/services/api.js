

import { getToken, logout } from "../utils/storage.js";

// Em desenvolvimento, o Vite encaminha /api para o servidor Express.
// Em produção, aceita a URL do Render com ou sem /api no final.
const configuredApiUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const API_URL = configuredApiUrl.endsWith("/api")
    ? configuredApiUrl
    : `${configuredApiUrl}/api`;

export async function apiRequest(endpoint, options = {}) {

    const token = getToken();

    let response;

    try {
        response = await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                    ...options.headers
                }
            }
        );
    } catch {
        throw new Error("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    }

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
        ? await response.json()
        : {};

    const publicAuthEndpoints = ["/login", "/register", "/forgot-password", "/reset-password"];
    if (response.status === 401 && token && !publicAuthEndpoints.includes(endpoint)) {
        logout();
        data.error = "Sua sessão expirou. Entre novamente para continuar.";
        data.sessionExpired = true;
    }

    return { response, data };

}
