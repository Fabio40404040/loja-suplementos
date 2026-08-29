import { readFile } from "node:fs/promises";
import { closeDatabase, initializeDatabase, sql } from "../database.js";

const USERS_FILE = new URL("../data/users.json", import.meta.url);
const ORDERS_FILE = new URL("../data/orders.json", import.meta.url);

function totalToCents(total) {
    const normalized = String(total)
        .replace(/[^\d,.-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".");

    return Math.round(Number(normalized) * 100);
}

async function readJson(file) {
    return JSON.parse(await readFile(file, "utf8"));
}

async function migrate() {
    const [users, orders] = await Promise.all([
        readJson(USERS_FILE),
        readJson(ORDERS_FILE)
    ]);

    await initializeDatabase();

    await sql.begin(async (transaction) => {
        for (const user of users) {
            await transaction`
                INSERT INTO users (id, first_name, email, password_hash)
                VALUES (${user.id}, ${user.firstName}, ${user.email.toLowerCase()}, ${user.password})
                ON CONFLICT (id) DO UPDATE SET
                    first_name = EXCLUDED.first_name,
                    email = EXCLUDED.email,
                    password_hash = EXCLUDED.password_hash
            `;
        }

        for (const order of orders) {
            const totalCents = totalToCents(order.total);

            if (!Number.isInteger(totalCents) || totalCents < 0) {
                throw new Error(`Total inválido no pedido ${order.id}.`);
            }

            await transaction`
                INSERT INTO orders (id, user_id, total_cents, created_at)
                VALUES (${order.id}, ${order.userId}, ${totalCents}, ${order.createdAt})
                ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    total_cents = EXCLUDED.total_cents,
                    created_at = EXCLUDED.created_at
            `;

            await transaction`DELETE FROM order_items WHERE order_id = ${order.id}`;

            for (const item of order.items || []) {
                await transaction`
                    INSERT INTO order_items (order_id, product_id, name, price_cents, quantity)
                    VALUES (
                        ${order.id},
                        ${item.id},
                        ${item.name},
                        ${Math.round(Number(item.price) * 100)},
                        ${item.quantity}
                    )
                `;
            }
        }

        await transaction`
            SELECT SETVAL(
                PG_GET_SERIAL_SEQUENCE('users', 'id'),
                GREATEST(COALESCE((SELECT MAX(id) FROM users), 1), 1),
                true
            )
        `;
        await transaction`
            SELECT SETVAL(
                PG_GET_SERIAL_SEQUENCE('orders', 'id'),
                GREATEST(COALESCE((SELECT MAX(id) FROM orders), 1000), 1000),
                true
            )
        `;
    });

    console.log(`${users.length} usuários e ${orders.length} pedidos migrados com sucesso.`);
}

try {
    await migrate();
} catch (error) {
    console.error("Não foi possível migrar os arquivos JSON:", error.message);
    process.exitCode = 1;
} finally {
    await closeDatabase();
}
