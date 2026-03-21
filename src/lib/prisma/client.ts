import "server-only";

import { createRuntimePrismaClient } from "./runtime";
import type { PrismaClient } from "@prisma/client";

declare global {
    var modernCaPortalPrisma: PrismaClient | undefined
}

function getPrismaClient() {
    if (!globalThis.modernCaPortalPrisma) {
        globalThis.modernCaPortalPrisma = createRuntimePrismaClient().prisma;
    }

    return globalThis.modernCaPortalPrisma;
}

const prisma = new Proxy({} as PrismaClient, {
    get(_target, property) {
        const client = getPrismaClient() as PrismaClient & Record<PropertyKey, unknown>;
        const value = Reflect.get(client, property, client);

        return typeof value === "function" ? value.bind(client) : value;
    },
});

export default prisma;
