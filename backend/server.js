
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import crypto from "crypto";
import bcrypt from "bcrypt";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET não foi configurado no arquivo backend/.env.");
}

app.use(cors({
    origin(origin, callback) {
        const isLocalDevelopment = !origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

        callback(isLocalDevelopment ? null : new Error("Origem não permitida."), isLocalDevelopment);
    }
}));
app.use(express.json());

const USERS_FILE = new URL("./data/users.json", import.meta.url);
const USERS_TEMP_FILE = new URL("./data/users.tmp.json", import.meta.url);
const ORDERS_FILE = new URL("./data/orders.json", import.meta.url);
const ORDERS_TEMP_FILE = new URL("./data/orders.tmp.json", import.meta.url);
const defaultUsers = [{
    id: 1,
    firstName: "Fábio",
    email: "fabio7@outlook.com",
    password:"$2b$10$X6uY83QTsvA1AT3S.Qi6ie4QPMHFS2qqfBPpHUHtJp9tgnVtD7ugG"
}];

async function saveUsers(usersToSave) {
    await mkdir(new URL("./data/", import.meta.url), { recursive: true });
    await writeFile(USERS_TEMP_FILE, JSON.stringify(usersToSave, null, 2));
    await rename(USERS_TEMP_FILE, USERS_FILE);
}

async function loadUsers() {
    try {
        const fileContent = await readFile(USERS_FILE, "utf8");
        const savedUsers = JSON.parse(fileContent);

        if (!Array.isArray(savedUsers)) throw new Error("Formato de usuários inválido.");
        return savedUsers;
    } catch (error) {
        if (error.code !== "ENOENT") throw error;

        await saveUsers(defaultUsers);
        return [...defaultUsers];
    }
}

const users = await loadUsers();
let nextId = users.reduce((largestId, user) => Math.max(largestId, user.id), 0) + 1;

const PREPARATION_TIME_MS = 30 * 1000;
const SHIPPING_TIME_MS = 60 * 1000;
const defaultOrders = [
    { id: 1021, userId: 1, createdAt: "2026-07-28T12:00:00.000Z", total: "R$ 189,90", items: [] },
    { id: 1035, userId: 1, createdAt: "2026-08-02T12:00:00.000Z", total: "R$ 79,90", items: [] }
];

async function saveOrders(ordersToSave) {
    await mkdir(new URL("./data/", import.meta.url), { recursive: true });
    await writeFile(ORDERS_TEMP_FILE, JSON.stringify(ordersToSave, null, 2));
    await rename(ORDERS_TEMP_FILE, ORDERS_FILE);
}

async function loadOrders() {
    try {
        const fileContent = await readFile(ORDERS_FILE, "utf8");
        const savedOrders = JSON.parse(fileContent);

        if (!Array.isArray(savedOrders)) throw new Error("Formato de pedidos inválido.");
        return savedOrders;
    } catch (error) {
        if (error.code !== "ENOENT") throw error;

        await saveOrders(defaultOrders);
        return [...defaultOrders];
    }
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

const orders = await loadOrders();
let nextOrderId = orders.reduce((largestId, order) => Math.max(largestId, order.id), 1000) + 1;


// ===================== MIDDLEWARE DE AUTENTICAÇÃO =====================
// Protege rotas que exigem login, checando o token JWT enviado no header
function authMiddleware(request, response, next) {

    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return response.status(401).json({
            error: "Entrar na conta para finalizar."
        });
    }

    const token = authHeader.split(" ")[1]; // formato: "Bearer TOKEN"

    if (!token) {
        return response.status(401).json({
            error: "Token inválido."
        });
    }

    try {

        const decoded = jwt.verify(token, JWT_SECRET);

        request.userId = decoded.id;

        next();

    } catch (error) {

        return response.status(401).json({
            error: "Token expirado ou inválido."
        });

    }

}

//Rota api/login
app.post("/api/login", async (request, response) => {

    const email = request.body.email?.trim().toLowerCase();
    const { password } = request.body;

    if (!email || !password) {
        return response.status(400).json({
            error: "E-mail e senha são obrigatórios."
        });
    }

    const user = users.find((u) => u.email === email);

    if (!user) {
        return response.status(401).json({
            error: "E-mail ou senha inválidos."
        });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
        return response.status(401).json({
            error: "E-mail ou senha inválidos."
        });
    }

    const token = jwt.sign(
        { id: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return response.status(200).json({
        token,
        user: {
            id: user.id,
            firstName: user.firstName,
            email: user.email
        }
    });

});

//Rota api/regiter
app.post("/api/register", async (request, response) => {

    const email = request.body.email?.trim().toLowerCase();
    const { password } = request.body;

    if (!email || !password) {
        return response.status(400).json({
            error: "E-mail e senha são obrigatórios."
        });
    }

    if (password.length < 6) {
        return response.status(400).json({
            error: "A senha deve ter pelo menos 6 caracteres."
        });
    }

    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
        return response.status(409).json({
            error: "Este e-mail já está cadastrado."
        });
    }

    // Gera o hash da senha (nunca salva em texto puro)
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
        id: nextId++,
        firstName: email.split("@")[0],
        email,
        password: hashedPassword
    };

    users.push(newUser);
    await saveUsers(users);

    const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    return response.status(201).json({
        token,
        user: {
            id: newUser.id,
            firstName: newUser.firstName,
            email: newUser.email
        }
    });

});

// ===================== ESQUECI MINHA SENHA (simulado) =====================
app.post("/api/forgot-password", async (request, response) => {

    const { email } = request.body;

    const user = users.find((u) => u.email === email);

    // Por segurança, sempre respondemos sucesso, mesmo se o e-mail não existir
    // (evita que alguém descubra quais e-mails estão cadastrados)
    if (!user) {
        return response.status(200).json({
            message: "Se o e-mail existir, um link de redefinição foi gerado."
        });
    }

    // Gera um token aleatório e define expiração de 15 minutos
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000;

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await saveUsers(users);

    // SIMULADO: em produção, aqui enviaríamos um e-mail de verdade.
    // Por enquanto, devolvemos o link direto na resposta, só para teste.
    const resetLink = `http://localhost:5173/resetar-senha.html?token=${resetToken}`;

    console.log("Link de redefinição (simulado):", resetLink);

    return response.status(200).json({
        message: "Se o e-mail existir, um link de redefinição foi gerado.",
        resetLink // presente só na simulação — remover isso quando integrar e-mail real
    });

});


// ===================== REDEFINIR SENHA (simulado) =====================
app.post("/api/reset-password", async (request, response) => {

    const { token, newPassword } = request.body;

    if (!token || !newPassword) {
        return response.status(400).json({
            error: "Token e nova senha são obrigatórios."
        });
    }

    const user = users.find((u) => u.resetToken === token);

    if (!user) {
        return response.status(400).json({
            error: "Token inválido."
        });
    }

    if (Date.now() > user.resetTokenExpiry) {
        return response.status(400).json({
            error: "Token expirado. Solicite um novo link."
        });
    }

    // Hasheia a nova senha antes de salvar
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await saveUsers(users);

    return response.status(200).json({
        message: "Senha redefinida com sucesso!"
    });

});

//* ===================== CRIAR PEDIDO (protegida) =====================

app.get("/api/orders", authMiddleware, (request, response) => {
    const userOrders = orders
        .filter((order) => order.userId === request.userId)
        .sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt))
        .map(orderWithCurrentStatus);

    return response.status(200).json({ orders: userOrders });
});

app.post("/api/orders", authMiddleware, async (request, response) => {

    const { items } = request.body;

    // Validação básica
    if (!items || !Array.isArray(items) || items.length === 0) {
        return response.status(400).json({
            error: "O carrinho está vazio."
        });
    }

    // Calcula o total somando (preço x quantidade) de cada item
    const totalValue = items.reduce(
        (sum, item) => sum + (item.price * item.quantity),
        0
    );

    const newOrder = {
        id: nextOrderId++,
        userId: request.userId,
        createdAt: new Date().toISOString(),
        total: `R$ ${totalValue.toFixed(2).replace(".", ",")}`,
        items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }))
    };

    orders.push(newOrder);
    await saveOrders(orders);

    return response.status(201).json({
        order: orderWithCurrentStatus(newOrder)
    });

});

// ===================== ROTA DE PERFIL (protegida, opcional) =====================
app.get("/api/me", authMiddleware, (request, response) => {

    const user = users.find((u) => u.id === request.userId);

    if (!user) {
        return response.status(404).json({
            error: "Usuário não encontrado."
        });
    }

    return response.status(200).json({
        user: {
            id: user.id,
            firstName: user.firstName,
            email: user.email
        }
    });

});


app.listen(PORT, () => {
    console.log(`API disponível em http://localhost:${PORT}`);
});
