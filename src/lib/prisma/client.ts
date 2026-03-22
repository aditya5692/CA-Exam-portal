// Cache buster: 2026-03-23-subscription-v1
import "server-only";

import { createRuntimePrismaClient } from "./runtime";
import type { PrismaClient } from "@prisma/client";

declare global {
    var modernCaPortalPrismaV2: PrismaClient | undefined
}

function getPrismaClient() {
    if (!globalThis.modernCaPortalPrismaV2) {
        globalThis.modernCaPortalPrismaV2 = createRuntimePrismaClient().prisma;
    }

    return globalThis.modernCaPortalPrismaV2;
}

const prisma = new Proxy({} as PrismaClient, {
    get(_target, property) {
        const client = getPrismaClient() as PrismaClient & Record<PropertyKey, unknown>;
        const value = Reflect.get(client, property, client);

        return typeof value === "function" ? value.bind(client) : value;
    },
});

export default prisma;
 
