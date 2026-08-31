// Salva o token
export function saveToken(token) {
    localStorage.setItem("token", token);
}
// Obtém o token
export function getToken() {
    return localStorage.getItem("token");
}

function tokenExpired(token) {
    try {
        const payload = token.split(".")[1];
        if (!payload) return true;

        const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
        const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, "=");
        const { exp } = JSON.parse(atob(paddedPayload));
        return !Number.isFinite(exp) || exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}
// Remove o token
export function removeToken() {
    localStorage.removeItem("token");
}
// Salva o usuário
export function saveUser(user) {
    localStorage.setItem("user", JSON.stringify(user));
}
// Obtém o usuário
export function getUser() {

    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;

}
// Verifica se está autenticado
export function isAuthenticated() {
    const token = getToken();
    if (!token) return false;

    if (tokenExpired(token)) {
        logout();
        return false;
    }

    return true;

}
// Logout
export function logout() {
    removeToken();
    localStorage.removeItem("user");
}
