import "server-only";

import { createRuntimePrismaClient } from "./runtime";

const prismaClientSingleton = () => createRuntimePrismaClient().prisma;

declare global {
    var modernCaPortalPrisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.modernCaPortalPrisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
    globalThis.modernCaPortalPrisma = prisma;
}
