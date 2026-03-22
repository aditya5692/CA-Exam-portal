import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { Pool,type PoolConfig } from "pg";

const DEFAULT_POOL_MAX = 10;
const DEFAULT_DEVELOPMENT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_PRODUCTION_CONNECT_TIMEOUT_MS = 30_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const SUPPORTED_DATABASE_PROTOCOLS = new Set(["postgresql:", "postgres:", "file:"]);

export type DatabaseRuntimeConfig = {
    databaseUrl: string;
    sourceEnvKey: string;
    redactedDatabaseUrl: string;
    protocol: string;
    poolConfig: PoolConfig;
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

function getDatabaseUrlEnvKeys(env: EnvLike) {
    const preferredKeys = env.NODE_ENV === "production"
        ? [
            "DOKPLOY_DATABASE_URL",
            "POSTGRES_INTERNAL_URL",
            "DATABASE_URL",
            "POSTGRES_URL",
            "POSTGRES_PRISMA_URL",
            "POSTGRESQL_URL",
            "DATABASE_URI",
            "LOCAL_DATABASE_URL",
            "POSTGRES_EXTERNAL_URL",
        ]
        : [
            "LOCAL_DATABASE_URL",
            "DATABASE_URL",
            "POSTGRES_EXTERNAL_URL",
            "DOKPLOY_DATABASE_URL",
            "POSTGRES_INTERNAL_URL",
            "POSTGRES_URL",
            "POSTGRES_PRISMA_URL",
            "POSTGRESQL_URL",
            "DATABASE_URI",
        ];

    return [...new Set([...preferredKeys, ...SHARED_DATABASE_URL_ENV_KEYS])];
}

function readDatabaseUrlFromEnv(env: EnvLike) {
    for (const key of getDatabaseUrlEnvKeys(env)) {
        const value = normalizeEnvString(env[key]);
        if (value) {
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
    minimum = 1,
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
    try {
        protocol = new URL(databaseUrl).protocol;
    } catch {
        throw new Error("DATABASE_URL is invalid.");
    }

    if (!SUPPORTED_DATABASE_PROTOCOLS.has(protocol)) {
        throw new Error(`Unsupported DATABASE_URL protocol "${protocol}". Use a PostgreSQL connection string.`);
    }

    return {
        databaseUrl,
        sourceEnvKey,
        redactedDatabaseUrl: redactDatabaseUrl(databaseUrl),
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
            allowExitOnIdle: true,
        },
    };
}

export function createPostgresPool(config: DatabaseRuntimeConfig) {
    const pool = new Pool(config.poolConfig);

    pool.on("error", (error) => {
        console.error("PostgreSQL pool error:", {
            message: error.message,
            databaseUrl: config.redactedDatabaseUrl,
        });
    });

    return pool;
}

export function createRuntimePrismaClient(env: EnvLike = process.env) {
    const config = readDatabaseRuntimeConfig(env);

    if (config.protocol === "file:") {
        // Use the better-sqlite3 adapter for Prisma 7 compatibility
        const adapter = new PrismaBetterSqlite3({
            url: config.databaseUrl.replace("file:", ""),
        });
        const prisma = new PrismaClient({ adapter });
        return { prisma, config };
    }

    const pool = createPostgresPool(config);
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    return {
        prisma,
        pool,
        config,
    };
}
