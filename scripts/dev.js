import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let stopping = false;

function run(args, cwd) {
    const child = spawn(npmCommand, args, {
        cwd,
        stdio: "inherit"
    });

    children.push(child);

    child.on("error", (error) => {
        console.error(`Não foi possível iniciar o projeto: ${error.message}`);
        stop(1);
    });

    child.on("exit", (code, signal) => {
        if (!stopping) {
            const reason = signal ? `sinal ${signal}` : `código ${code}`;
            console.error(`Uma parte do projeto foi encerrada (${reason}).`);
            stop(code || 1);
        }
    });
}

function stop(exitCode = 0) {
    if (stopping) return;
    stopping = true;

    for (const child of children) {
        if (!child.killed) child.kill("SIGTERM");
    }

    setTimeout(() => process.exit(exitCode), 100).unref();
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));

run(["run", "dev"], resolve(projectRoot, "backend"));
run(["run", "dev:frontend"], projectRoot);
