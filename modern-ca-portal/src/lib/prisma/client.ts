import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
        throw new Error('DATABASE_URL is not set.')
    }

    return new PrismaClient({
        adapter: new PrismaBetterSqlite3({ url: databaseUrl }),
    })
}

declare global {
    var modernCaPortalPrisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const isValidPrismaClient = (client: typeof globalThis.modernCaPortalPrisma) =>
    Boolean(
        client &&
        typeof (client as { user?: unknown }).user !== "undefined" &&
        typeof (client as { batch?: unknown }).batch !== "undefined"
    )

const prisma = isValidPrismaClient(globalThis.modernCaPortalPrisma)
    ? globalThis.modernCaPortalPrisma!
    : prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.modernCaPortalPrisma = prisma
}
