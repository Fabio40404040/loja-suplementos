import crypto from "node:crypto";
import bcrypt from "bcrypt";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import {
    EXPOSE_RESET_LINK,
    FRONTEND_URLS,
    JWT_SECRET,
    PORT,
    PRIMARY_FRONTEND_URL
} from "./config.js";
import { closeDatabase, initializeDatabase, sql } from "./database.js";
import { sendPasswordResetEmail } from "./email.js";

const app = express();
const PREPARATION_TIME_MS = 30 * 1000;
const SHIPPING_TIME_MS = 60 * 1000;
const VERCEL_FRONTEND_URLS = new Set([
    "https://loja-suplementos-alpha.vercel.app",
    "https://loja-suplementos.vercel.app"
]);

app.disable("x-powered-by");
app.use(cors({
    origin(origin, callback) {
        const normalizedOrigin = origin?.replace(/\/$/, "");
        const allowed = !origin
            || FRONTEND_URLS.includes(normalizedOrigin)
            || VERCEL_FRONTEND_URLS.has(normalizedOrigin);
        callback(allowed ? null : new Error("Origem não permitida."), allowed);
    }
}));
app.use(express.json({ limit: "100kb" }));

function publicUser(user) {
    return {
        id: Number(user.id),
        firstName: user.first_name,
        email: user.email
    };
}

function formatCurrency(cents) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(cents / 100);
}

function passwordValidationError(password) {
    const valid = password.length >= 8
        && /[A-Z]/.test(password)
        && /[^A-Za-z0-9\s]/.test(password);

    return valid
        ? null
        : "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula e um caractere especial.";
}

function normalizedOrder(order) {
    const createdAt = new Date(order.created_at);
    const items = Array.isArray(order.items) ? order.items : [];

    return {
        id: Number(order.id),
        userId: Number(order.user_id),
        createdAt: createdAt.toISOString(),
        total: formatCurrency(order.total_cents),
        paymentStatus: order.payment_status === "approved"
            ? "Pagamento recebido"
            : "Pagamento pendente",
        paymentApproved: order.payment_status === "approved",
        items: items.map((item) => ({
            id: Number(item.id),
            name: item.name,
            price: item.priceCents / 100,
            quantity: item.quantity
        }))
    };
}

function orderWithCurrentStatus(order) {
    const createdAt = new Date(order.createdAt).getTime();
    const elapsedTime = Date.now() - createdAt;
    let status = "Pedido entregue";
    let statusStep = 2;
    let nextStatusAt = null;

    if (elapsedTime < PREPARATION_TIME_MS) {
        status = "Em preparação";
        statusStep = 0;
        nextStatusAt = new Date(createdAt + PREPARATION_TIME_MS).toISOString();
    } else if (elapsedTime < SHIPPING_TIME_MS) {
        status = "Pedido enviado";
        statusStep = 1;
        nextStatusAt = new Date(createdAt + SHIPPING_TIME_MS).toISOString();
    }

    return {
        ...order,
        data: new Date(order.createdAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        }),
        status,
        statusStep,
        nextStatusAt
    };
}

async function findOrdersForUser(userId, orderId = null) {
    const rows = orderId === null
        ? await sql`
            SELECT
                orders.id,
                orders.user_id,
                orders.total_cents,
                orders.payment_status,
                orders.created_at,
                COALESCE((
                    SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'id', order_items.product_id,
                        'name', order_items.name,
                        'priceCents', order_items.price_cents,
                        'quantity', order_items.quantity
                    ) ORDER BY order_items.id)
                    FROM order_items
                    WHERE order_items.order_id = orders.id
                ), '[]'::JSON) AS items
            FROM orders
            WHERE orders.user_id = ${userId}
            ORDER BY orders.created_at DESC
        `
        : await sql`
            SELECT
                orders.id,
                orders.user_id,
                orders.total_cents,
                orders.payment_status,
                orders.created_at,
                COALESCE((
                    SELECT JSON_AGG(JSON_BUILD_OBJECT(
                        'id', order_items.product_id,
                        'name', order_items.name,
                        'priceCents', order_items.price_cents,
                        'quantity', order_items.quantity
                    ) ORDER BY order_items.id)
                    FROM order_items
                    WHERE order_items.order_id = orders.id
                ), '[]'::JSON) AS items
            FROM orders
            WHERE orders.user_id = ${userId} AND orders.id = ${orderId}
        `;

    return rows.map(normalizedOrder).map(orderWithCurrentStatus);
}

function authMiddleware(request, response, next) {
    const [scheme, token] = (request.headers.authorization || "").split(" ");

    if (scheme !== "Bearer" || !token) {
        return response.status(401).json({ error: "Entrar na conta para finalizar." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        request.userId = decoded.id;
        return next();
    } catch {
        return response.status(401).json({ error: "Token expirado ou inválido." });
    }
}

app.get("/api/health", async (_request, response) => {
    await sql`SELECT 1`;
    return response.status(200).json({ status: "ok" });
});

app.post("/api/login", async (request, response) => {
    const email = request.body.email?.trim().toLowerCase();
    const { password } = request.body;

    if (!email || !password) {
        return response.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const [user] = await sql`
        SELECT id, first_name, email, password_hash
        FROM users
        WHERE email = ${email}
        LIMIT 1
    `;

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return response.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    return response.status(200).json({ token, user: publicUser(user) });
});

app.post("/api/register", async (request, response) => {
    const email = request.body.email?.trim().toLowerCase();
    const { password } = request.body;

    if (!email || !password) {
        return response.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const passwordError = passwordValidationError(password);
    if (passwordError) return response.status(400).json({ error: passwordError });

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const [user] = await sql`
            INSERT INTO users (first_name, email, password_hash)
            VALUES (${email.split("@")[0]}, ${email}, ${hashedPassword})
            RETURNING id, first_name, email
        `;

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        return response.status(201).json({ token, user: publicUser(user) });
    } catch (error) {
        if (error.code === "23505") {
            return response.status(409).json({ error: "Este e-mail já está cadastrado." });
        }

        throw error;
    }
});

app.post("/api/forgot-password", async (request, response) => {
    const email = request.body.email?.trim().toLowerCase();
    const successMessage = "Se o e-mail estiver cadastrado, enviaremos um link de redefinição.";

    if (!email) {
        return response.status(400).json({ error: "Informe seu e-mail." });
    }

    const [user] = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (!user) return response.status(200).json({ message: successMessage });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await sql`
        UPDATE users
        SET reset_token_hash = ${resetTokenHash}, reset_token_expires_at = ${resetTokenExpiresAt}
        WHERE id = ${user.id}
    `;

    const resetLink = `${PRIMARY_FRONTEND_URL}/resetar-senha.html?token=${resetToken}`;

    try {
        await sendPasswordResetEmail({ to: email, resetLink });
    } catch (error) {
        await sql`
            UPDATE users
            SET reset_token_hash = NULL, reset_token_expires_at = NULL
            WHERE id = ${user.id}
        `;
        throw error;
    }

    return response.status(200).json({
        message: successMessage,
        ...(EXPOSE_RESET_LINK && { resetLink })
    });
});

app.post("/api/reset-password", async (request, response) => {
    const { token, newPassword } = request.body;

    if (!token || !newPassword) {
        return response.status(400).json({ error: "Token e nova senha são obrigatórios." });
    }

    const passwordError = passwordValidationError(newPassword);
    if (passwordError) return response.status(400).json({ error: passwordError });

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const [user] = await sql`
        SELECT id, reset_token_expires_at
        FROM users
        WHERE reset_token_hash = ${resetTokenHash}
        LIMIT 1
    `;

    if (!user) return response.status(400).json({ error: "Token inválido." });
    if (new Date(user.reset_token_expires_at).getTime() < Date.now()) {
        return response.status(400).json({ error: "Token expirado. Solicite um novo link." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await sql`
        UPDATE users
        SET password_hash = ${hashedPassword}, reset_token_hash = NULL, reset_token_expires_at = NULL
        WHERE id = ${user.id}
    `;

    return response.status(200).json({ message: "Senha redefinida com sucesso!" });
});

app.get("/api/orders", authMiddleware, async (request, response) => {
    const orders = await findOrdersForUser(request.userId);
    return response.status(200).json({ orders });
});

app.post("/api/orders", authMiddleware, async (request, response) => {
    const { items } = request.body;

    if (!Array.isArray(items) || items.length === 0) {
        return response.status(400).json({ error: "O carrinho está vazio." });
    }

    const normalizedItems = items.map((item) => ({
        id: Number(item.id),
        name: String(item.name || "").trim(),
        priceCents: Math.round(Number(item.price) * 100),
        quantity: Number(item.quantity)
    }));

    const invalidItem = normalizedItems.some((item) => (
        !Number.isInteger(item.id)
        || !item.name
        || !Number.isInteger(item.priceCents)
        || item.priceCents < 0
        || !Number.isInteger(item.quantity)
        || item.quantity <= 0
    ));

    if (invalidItem) {
        return response.status(400).json({ error: "Há um produto inválido no carrinho." });
    }

    const totalCents = normalizedItems.reduce(
        (total, item) => total + item.priceCents * item.quantity,
        0
    );

    const orderId = await sql.begin(async (transaction) => {
        const [order] = await transaction`
            INSERT INTO orders (user_id, total_cents, payment_status)
            VALUES (${request.userId}, ${totalCents}, ${"approved"})
            RETURNING id
        `;

        for (const item of normalizedItems) {
            await transaction`
                INSERT INTO order_items (order_id, product_id, name, price_cents, quantity)
                VALUES (${order.id}, ${item.id}, ${item.name}, ${item.priceCents}, ${item.quantity})
            `;
        }

        return order.id;
    });

    const [order] = await findOrdersForUser(request.userId, orderId);
    return response.status(201).json({ order });
});

app.get("/api/me", authMiddleware, async (request, response) => {
    const [user] = await sql`
        SELECT id, first_name, email
        FROM users
        WHERE id = ${request.userId}
        LIMIT 1
    `;

    if (!user) return response.status(404).json({ error: "Usuário não encontrado." });
    return response.status(200).json({ user: publicUser(user) });
});

app.use((error, _request, response, _next) => {
    console.error(error);

    if (error.message === "Origem não permitida.") {
        return response.status(403).json({ error: error.message });
    }

    return response.status(500).json({ error: "Erro interno do servidor." });
});

await initializeDatabase();

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`API disponível na porta ${PORT}`);
});

async function shutdown() {
    server.close(async () => {
        await closeDatabase();
        process.exit(0);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
