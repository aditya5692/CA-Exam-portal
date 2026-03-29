import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { Pool, type PoolConfig } from "pg";

const DEFAULT_POOL_MAX = 10;
const DEFAULT_DEVELOPMENT_CONNECT_TIMEOUT_MS = 60_000; // Increased for remote DB latency
const DEFAULT_PRODUCTION_CONNECT_TIMEOUT_MS = 60_000;
const DEFAULT_IDLE_TIMEOUT_MS = 60_000;
const DEFAULT_STATEMENT_TIMEOUT_MS = 30_000;
const SUPPORTED_DATABASE_PROTOCOLS = new Set(["postgresql:", "postgres:", "file:"]);

export type DatabaseRuntimeConfig = {
    databaseUrl: string;
    sourceEnvKey: string;
    redactedDatabaseUrl: string;
    protocol: string;
    poolConfig: PoolConfig & { statement_timeout?: number };
};

type EnvLike = Record<string, string | undefined>;

const SHARED_DATABASE_URL_ENV_KEYS = [
    "DATABASE_URL",
    "DOKPLOY_DATABASE_URL",
    "LOCAL_DATABASE_URL",
    "POSTGRES_INTERNAL_URL",
    "POSTGRES_EXTERNAL_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRESQL_URL",
    "DATABASE_URI",
] as const;

function normalizeEnvString(rawValue: string | undefined) {
    if (!rawValue) {
        return "";
    }

    const trimmed = rawValue.trim();
    const quoteWrapped =
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"));

    return quoteWrapped ? trimmed.slice(1, -1).trim() : trimmed;
}

function getDatabaseUrlEnvKeys() {
    return [
        "LOCAL_DATABASE_URL", // 💡 Priority 1: Direct Local Override
        "DOKPLOY_DATABASE_URL", // 🔵 Priority 2: Dokploy Production (Internal)
        "POSTGRES_INTERNAL_URL",
        "DATABASE_URL", // 🔘 Priority 3: Standard Environment
        "POSTGRES_URL",
        "POSTGRES_PRISMA_URL",
        "POSTGRESQL_URL",
        "DATABASE_URI",
        "POSTGRES_EXTERNAL_URL",
    ];
}

function readDatabaseUrlFromEnv(env: EnvLike) {
    const keysToCheck = getDatabaseUrlEnvKeys();

    // Deterministic selection: First match wins
    for (const key of keysToCheck) {
        const value = normalizeEnvString(env[key]);
        if (value) {
            const redacted = redactDatabaseUrl(value);
            const isSqlite = value.startsWith("file:");
            
            console.log(`[RuntimePrisma] Selected ${key} (${isSqlite ? "SQLite" : "PostgreSQL"})`);
            if (env.NODE_ENV !== "production") {
                console.log(`[RuntimePrisma] Target: ${redacted}`);
            }
            return { key, value };
        }
    }

    return { key: "", value: "" };
}

function getDefaultConnectTimeoutMs(env: EnvLike) {
    return env.NODE_ENV === "production"
        ? DEFAULT_PRODUCTION_CONNECT_TIMEOUT_MS
        : DEFAULT_DEVELOPMENT_CONNECT_TIMEOUT_MS;
}

function parseDatabaseIntegerEnv(
    rawValue: string | undefined,
    fallback: number,
    name: string,
    minimum = 0,
) {
    if (rawValue === undefined || rawValue.trim() === "") {
        return fallback;
    }

    const parsed = Number.parseInt(rawValue.trim(), 10);
    if (!Number.isFinite(parsed) || parsed < minimum) {
        throw new Error(`${name} must be an integer greater than or equal to ${minimum}.`);
    }

    return parsed;
}

export function redactDatabaseUrl(databaseUrl: string) {
    if (databaseUrl.startsWith("file:")) {
        return databaseUrl; // No sensitive info in file paths usually, and avoid URL constructor bugs
    }
    try {
        const parsedUrl = new URL(databaseUrl);

        if (parsedUrl.username) {
            parsedUrl.username = "***";
        }

        if (parsedUrl.password) {
            parsedUrl.password = "***";
        }

        return parsedUrl.toString();
    } catch {
        return "[invalid DATABASE_URL]";
    }
}

export function readDatabaseRuntimeConfig(env: EnvLike = process.env): DatabaseRuntimeConfig {
    const { key: sourceEnvKey, value: databaseUrl } = readDatabaseUrlFromEnv(env);
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    let protocol: string;
    if (databaseUrl.startsWith("file:")) {
        protocol = "file:";
    } else {
        try {
            protocol = new URL(databaseUrl).protocol;
        } catch {
            throw new Error("DATABASE_URL is invalid.");
        }
    }

    if (!SUPPORTED_DATABASE_PROTOCOLS.has(protocol)) {
        throw new Error(`Unsupported DATABASE_URL protocol "${protocol}". Use a PostgreSQL or SQLite "file:" connection string.`);
    }

    const redacted = redactDatabaseUrl(databaseUrl);

    return {
        databaseUrl,
        sourceEnvKey,
        redactedDatabaseUrl: redacted,
        protocol,
        poolConfig: {
            connectionString: databaseUrl,
            max: parseDatabaseIntegerEnv(env.DATABASE_POOL_MAX, DEFAULT_POOL_MAX, "DATABASE_POOL_MAX"),
            connectionTimeoutMillis: parseDatabaseIntegerEnv(
                env.DATABASE_CONNECT_TIMEOUT_MS,
                getDefaultConnectTimeoutMs(env),
                "DATABASE_CONNECT_TIMEOUT_MS",
            ),
            idleTimeoutMillis: parseDatabaseIntegerEnv(
                env.DATABASE_IDLE_TIMEOUT_MS,
                DEFAULT_IDLE_TIMEOUT_MS,
                "DATABASE_IDLE_TIMEOUT_MS",
            ),
            statement_timeout: parseDatabaseIntegerEnv(
                env.DATABASE_STATEMENT_TIMEOUT_MS,
                DEFAULT_STATEMENT_TIMEOUT_MS,
                "DATABASE_STATEMENT_TIMEOUT_MS",
            ),
            allowExitOnIdle: true,
            keepAlive: true,
        },
    };
}


export function createPostgresPool(config: DatabaseRuntimeConfig) {
    const pool = new Pool(config.poolConfig);

    pool.on("error", (error) => {
        const isTimeout = error.message.includes("timeout") || error.message.includes("terminated");
        const ipMatch = config.databaseUrl.match(/@([^:/]+)/);
        const targetIp = ipMatch ? ipMatch[1] : "the database";

        console.error("\n" + "=".repeat(60));
        console.error(`❌ [PostgreSQL Pool Error] ${isTimeout ? "CONNECTIVITY FAILURE" : "DATABASE ERROR"}`);
        console.error(`- Message: ${error.message}`);
        console.error(`- Target: ${targetIp} (Port: 5432)`);
        
        if (isTimeout) {
            console.error("\nDIAGNOSIS:");
            console.error("1. Port 5432 may be blocked by your local network, firewall, or ISP.");
            console.error("2. You may need a VPN if the server is in a private network.");
            console.error(`3. Confirm your public IP is whitelisted on the server at ${targetIp}.`);
            console.error("4. Check if the database service is currently active at this address.");
            console.error("\nLOCAL FALLBACK:");
            console.error("If this is a local development issue, uncomment LOCAL_DATABASE_URL in .env");
            console.error("to use the stable SQLite fallback.");
        }
        console.error("=".repeat(60) + "\n");
    });

    return pool;
}

export function createRuntimePrismaClient(env: EnvLike = process.env) {
    const config = readDatabaseRuntimeConfig(env);

    try {
        // If the build script set the schema to SQLite
        if (config.protocol === "file:") {
            // Priority: Use the better-sqlite3 adapter for Prisma 7 standard compatibility
            const adapter = new PrismaBetterSqlite3({
                url: config.databaseUrl.replace("file:", ""),
            });
            const prisma = new PrismaClient({ adapter });
            return { prisma, config };
        }

        // Standard PostgreSQL paths with pooling and connection resilience
        const pool = createPostgresPool(config);
        const adapter = new PrismaPg(pool);
        const prisma = new PrismaClient({ adapter });

        return {
            prisma,
            pool,
            config,
        };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        
        console.error("\n" + "=".repeat(60));
        console.error("❌ [PrismaRuntimeError] DATABASE INITIALIZATION FAILED");
        console.error(`- Environment: ${env.NODE_ENV || "development"}`);
        console.error(`- Source: ${config.sourceEnvKey} (${config.protocol})`);
        console.error(`- Error: ${message}`);
        console.error("=".repeat(60) + "\n");

        throw error;
    }
}

