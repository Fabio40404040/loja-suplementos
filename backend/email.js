import { RESEND_API_KEY, RESET_EMAIL_FROM } from "./config.js";

export async function sendPasswordResetEmail({ to, resetLink }) {
    if (!RESEND_API_KEY || !RESET_EMAIL_FROM) {
        throw new Error("O serviço de e-mail não foi configurado.");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "User-Agent": "forja-nutrition/1.0"
        },
        body: JSON.stringify({
            from: RESET_EMAIL_FROM,
            to: [to],
            subject: "Redefinição de senha — Forja Nutrition",
            text: [
                "Recebemos uma solicitação para redefinir sua senha na Forja Nutrition.",
                "",
                `Acesse este link para criar uma nova senha: ${resetLink}`,
                "",
                "O link expira em 15 minutos. Se você não fez essa solicitação, ignore este e-mail."
            ].join("\n"),
            html: `
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1c2118;line-height:1.6">
                    <h1 style="font-size:24px">Redefinição de senha</h1>
                    <p>Recebemos uma solicitação para redefinir sua senha na Forja Nutrition.</p>
                    <p style="margin:28px 0">
                        <a href="${resetLink}" style="background:#b7ed25;color:#111;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:700">
                            Criar nova senha
                        </a>
                    </p>
                    <p>Este link expira em 15 minutos.</p>
                    <p style="color:#5d6457;font-size:14px">Se você não fez essa solicitação, ignore este e-mail.</p>
                </div>
            `
        })
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`Falha ao enviar e-mail de redefinição (${response.status}): ${details}`);
    }
}
