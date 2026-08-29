

import { getToken } from "../utils/storage.js";

// Em desenvolvimento, o Vite encaminha /api para o servidor Express.
// A variável continua disponível para produção, caso a API fique em outro host.
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

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

    return { response, data };

}
