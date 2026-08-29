// Salva o token
export function saveToken(token) {
    localStorage.setItem("token", token);
}
// Obtém o token
export function getToken() {
    return localStorage.getItem("token");
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
    return !!getToken();

}
// Logout
export function logout() {
    removeToken();
    localStorage.removeItem("user");
}