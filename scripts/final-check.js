const { Client } = require("pg");
const { getDatabaseUrl, loadLocalEnv, redactDatabaseUrl } = require("./db-script-utils");

async function main() {
    loadLocalEnv();

    const { key, value } = getDatabaseUrl();
    console.log(`Using ${key}: ${redactDatabaseUrl(value)}`);

    if (value.startsWith("file:")) {
        const BetterSqlite3 = require("better-sqlite3");
        const db = new BetterSqlite3(value.replace(/^file:/, ""));
        try {
            const users = db.prepare('SELECT "registrationNumber", email, role FROM "User" LIMIT 5').all();
            console.table(users);
        } finally {
            db.close();
        }
        return;
    }

    if (!value.startsWith("postgres://") && !value.startsWith("postgresql://")) {
        throw new Error(`Unsupported database protocol in ${key}.`);
    }

    const client = new Client({
        connectionString: value,
    });

    try {
        await client.connect();

        const res = await client.query('SELECT "registrationNumber", email, role FROM "User" LIMIT 5');
        console.table(res.rows);
    } finally {
        await client.end();
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
