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

// In Prisma v7 with driver adapters, model accessors are lazy getters on the
// prototype — NOT enumerable own properties. Do NOT check `client.exam` etc.
// Just check whether a client instance exists at all.
const prisma = globalThis.modernCaPortalPrisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') {
    globalThis.modernCaPortalPrisma = prisma
}
