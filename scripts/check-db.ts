import { Client } from "pg";
import { readDatabaseRuntimeConfig } from "../src/lib/prisma/runtime";

async function main() {
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
