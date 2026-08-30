import dotenv from "dotenv";

dotenv.config();

function requiredEnvironmentVariable(name) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`${name} não foi configurado nas variáveis de ambiente.`);
    }

    return value;
}

function normalizedUrl(value) {
    return value.trim().replace(/\/$/, "");
}

export const PORT = Number(process.env.PORT) || 3000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const JWT_SECRET = requiredEnvironmentVariable("JWT_SECRET");
export const DATABASE_URL = requiredEnvironmentVariable("DATABASE_URL");
export const DATABASE_SSL = process.env.DATABASE_SSL !== "false";

export const FRONTEND_URLS = (process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")
    .map(normalizedUrl)
    .filter(Boolean);

export const PRIMARY_FRONTEND_URL = FRONTEND_URLS[0];
export const EXPOSE_RESET_LINK = process.env.EXPOSE_RESET_LINK === "true" || NODE_ENV !== "production";
export const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim() || "";
export const RESET_EMAIL_FROM = process.env.RESET_EMAIL_FROM?.trim() || "";
