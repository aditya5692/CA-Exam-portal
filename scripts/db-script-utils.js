const fs = require("node:fs");
const path = require("node:path");

const DATABASE_ENV_KEYS = [
    "LOCAL_DATABASE_URL",
    "DOKPLOY_DATABASE_URL",
    "POSTGRES_INTERNAL_URL",
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRESQL_URL",
    "DATABASE_URI",
    "POSTGRES_EXTERNAL_URL",
];

function loadEnvFile(fileName) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) {
        return;
    }

    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
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
        if (!key || process.env[key]) {
            continue;
        }

        let value = normalizedLine.slice(separatorIndex + 1).trim();
        const isQuoted =
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"));

        if (isQuoted) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    }
}

function loadLocalEnv() {
    loadEnvFile(".env");
    loadEnvFile(".env.local");
}

function getDatabaseUrl() {
    for (const key of DATABASE_ENV_KEYS) {
        const value = process.env[key]?.trim();
        if (value) {
            return { key, value };
        }
    }

    throw new Error("No database URL found in environment. Set LOCAL_DATABASE_URL, DOKPLOY_DATABASE_URL, or DATABASE_URL.");
}

function redactDatabaseUrl(databaseUrl) {
    if (databaseUrl.startsWith("file:")) {
        return databaseUrl;
    }

    try {
        const parsed = new URL(databaseUrl);
        if (parsed.username) {
            parsed.username = "***";
        }
        if (parsed.password) {
            parsed.password = "***";
        }
        return parsed.toString();
    } catch {
        return "[invalid DATABASE_URL]";
    }
}

module.exports = {
    getDatabaseUrl,
    loadLocalEnv,
    redactDatabaseUrl,
};
