import { apiRequest } from "./api.js";

export async function createOrder(items) {

    const { response, data } = await apiRequest(
        "/orders",
        {
            method: "POST",
            body: JSON.stringify({ items })
        }
    );

    if (!response.ok) {

        throw new Error(
            data.error || "Não foi possível finalizar a compra."
        );

    }

    return data;

}