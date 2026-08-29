const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MESSAGE = "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial.";

export function validatePassword(password) {
    const hasMinimumLength = password.length >= PASSWORD_MIN_LENGTH;
    const hasUppercaseLetter = /[A-Z]/.test(password);
    const hasSpecialCharacter = /[^A-Za-z0-9\s]/.test(password);

    return {
        valid: hasMinimumLength && hasUppercaseLetter && hasSpecialCharacter,
        message: PASSWORD_MESSAGE
    };
}
