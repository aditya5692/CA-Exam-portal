import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool,type PoolConfig } from "pg";

const DEFAULT_POOL_MAX = 10;
const DEFAULT_CONNECT_TIMEOUT_MS = 10_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;
const SUPPORTED_DATABASE_PROTOCOLS = new Set(["postgresql:", "postgres:"]);

export type DatabaseRuntimeConfig = {
    databaseUrl: string;
    redactedDatabaseUrl: string;
    protocol: string;
    poolConfig: PoolConfig;
};

type EnvLike = Record<string, string | undefined>;

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
    const databaseUrl = env.DATABASE_URL?.trim();
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
        if (protocol === "file:" || protocol === "sqlite:") {
            throw new Error(
                "DATABASE_URL points to SQLite, but the current Prisma schema is PostgreSQL-only. Use a PostgreSQL DATABASE_URL for this runtime.",
            );
        }

        throw new Error(`Unsupported DATABASE_URL protocol "${protocol}". Use a PostgreSQL connection string.`);
    }

    return {
        databaseUrl,
        redactedDatabaseUrl: redactDatabaseUrl(databaseUrl),
        protocol,
        poolConfig: {
            connectionString: databaseUrl,
            max: parseDatabaseIntegerEnv(env.DATABASE_POOL_MAX, DEFAULT_POOL_MAX, "DATABASE_POOL_MAX"),
            connectionTimeoutMillis: parseDatabaseIntegerEnv(
                env.DATABASE_CONNECT_TIMEOUT_MS,
                DEFAULT_CONNECT_TIMEOUT_MS,
                "DATABASE_CONNECT_TIMEOUT_MS",
            ),
            idleTimeoutMillis: parseDatabaseIntegerEnv(
                env.DATABASE_IDLE_TIMEOUT_MS,
                DEFAULT_IDLE_TIMEOUT_MS,
                "DATABASE_IDLE_TIMEOUT_MS",
            ),
            allowExitOnIdle: env.NODE_ENV !== "production",
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
    const pool = createPostgresPool(config);
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    return {
        prisma,
        pool,
        config,
    };
}
