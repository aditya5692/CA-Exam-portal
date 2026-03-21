import { existsSync,readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRuntimePrismaClient } from "../src/lib/prisma/runtime";

function applyEnvFile(fileName: string) {
    const filePath = resolve(process.cwd(), fileName);
    if (!existsSync(filePath)) {
        return;
    }

    const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) {
            continue;
        }

        const normalizedLine = line.startsWith("export ") ? line.slice(7).trim() : line;
        const separatorIndex = normalizedLine.indexOf("=");
        if (separatorIndex <= 0) {
            continue;
        }

        const key = normalizedLine.slice(0, separatorIndex).trim();
        if (!key) {
            continue;
        }

        let value = normalizedLine.slice(separatorIndex + 1).trim();
        const quoteWrapped =
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"));

        if (quoteWrapped) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    }
}

async function main() {
    applyEnvFile(".env");
    applyEnvFile(".env.local");

    const { prisma, config } = createRuntimePrismaClient();

    console.log("Checking database connectivity...");
    console.log(`Env key: ${config.sourceEnvKey}`);
    console.log(`Target: ${config.redactedDatabaseUrl}`);
    console.log(`Protocol: ${config.protocol}`);

    try {
        // A simple query that works in both PostgreSQL and SQLite
        const result = await prisma.$queryRawUnsafe("SELECT 1 as connected");
        console.log("Connection successful.");
        // console.log("Result:", result); // Optional debug
    } catch (error) {
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database check failed: ${message}`);
    process.exit(1);
});
