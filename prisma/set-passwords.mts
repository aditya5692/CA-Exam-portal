import * as dotenv from 'dotenv';
import { createHash,scryptSync } from 'crypto';
import { createRuntimePrismaClient } from '../src/lib/prisma/runtime';

dotenv.config()

const { prisma } = createRuntimePrismaClient(process.env)

function makeHash(password: string, seed: string) {
    const salt = createHash('sha256').update(`modern-ca-portal-demo:${seed}`).digest('hex').slice(0, 32)
    const derived = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${derived}`
}

const users = await prisma.user.findMany({ where: { passwordHash: null } })
let count = 0
for (const u of users) {
    const seed = u.registrationNumber ?? u.email ?? u.id
    await prisma.user.update({
        where: { id: u.id },
        data: { passwordHash: makeHash('demo123', seed) },
    })
    count++
}

console.log(`✅ Updated ${count} users — password is now: demo123`)
await prisma.$disconnect()
