import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function requireDatabaseUrl() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured.");
    }

    return databaseUrl;
}

const prismaClientSingleton = () => {
    const pool = new Pool({
        connectionString: requireDatabaseUrl(),
        max: 10,
        connectionTimeoutMillis: 10_000,
        idleTimeoutMillis: 30_000,
        allowExitOnIdle: true,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
};

declare global {
    var modernCaPortalPrisma: undefined | ReturnType<typeof prismaClientSingleton>
}

// In Prisma v7 with driver adapters, model accessors are lazy getters on the
// prototype — NOT enumerable own properties. Do NOT check `client.exam` etc.
// Just check whether a client instance exists at all.
const prisma = globalThis.modernCaPortalPrisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
    globalThis.modernCaPortalPrisma = prisma;
}
