import { existsSync,readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";
import { readDatabaseRuntimeConfig } from "../src/lib/prisma/runtime";

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

    const config = readDatabaseRuntimeConfig();
    const client = new Client({
        connectionString: config.databaseUrl,
        connectionTimeoutMillis: config.poolConfig.connectionTimeoutMillis,
    });

    console.log("Checking database connectivity...");
    console.log(`Env key: ${config.sourceEnvKey}`);
    console.log(`Target: ${config.redactedDatabaseUrl}`);
    console.log(`Connect timeout: ${config.poolConfig.connectionTimeoutMillis}ms`);

    try {
        await client.connect();
        const result = await client.query<{
            current_database: string;
            current_user: string;
        }>("select current_database(), current_user");

        const row = result.rows[0];
        console.log("Connection successful.");
        console.log(`Database: ${row?.current_database ?? "unknown"}`);
        console.log(`User: ${row?.current_user ?? "unknown"}`);
    } finally {
        await client.end().catch(() => undefined);
    }
}

main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database check failed: ${message}`);
    process.exit(1);
});
