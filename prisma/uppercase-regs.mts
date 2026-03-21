/**
 * uppercase-regs.mts
 * Converts all seeded registration numbers to UPPERCASE
 * and re-hashes their passwords using the uppercase seed,
 * matching what auth-actions.ts expects (identifier.toUpperCase()).
 */
import * as dotenv from 'dotenv';
import { createHash,scryptSync } from 'crypto';
import { createRuntimePrismaClient } from '../src/lib/prisma/runtime';

dotenv.config()

const { prisma } = createRuntimePrismaClient(process.env)

function makeHash(password: string, seed: string) {
    const salt = createHash('sha256')
        .update(`modern-ca-portal-demo:${seed}`)
        .digest('hex')
        .slice(0, 32)
    const derived = scryptSync(password, salt, 64).toString('hex')
    return `${salt}:${derived}`
}

// Grab all seeded teachers (teacher1–teacher10) and students (student1–student100)
const users = await prisma.user.findMany({
    where: {
        OR: [
            { registrationNumber: { startsWith: 'teacher' } },
            { registrationNumber: { startsWith: 'student' } },
            { registrationNumber: { startsWith: 'TEACHER' } },
            { registrationNumber: { startsWith: 'STUDENT' } },
        ],
    },
})

let count = 0
for (const u of users) {
    const upperReg = u.registrationNumber!.toUpperCase()   // e.g. TEACHER1, STUDENT42

    await prisma.user.update({
        where: { id: u.id },
        data: {
            registrationNumber: upperReg,
            passwordHash: makeHash('demo123', upperReg),
        },
    })
    count++
}

console.log(`✅  Updated ${count} users`)
console.log('   Teachers : TEACHER1 … TEACHER10   password: demo123')
console.log('   Students : STUDENT1 … STUDENT100  password: demo123')
await prisma.$disconnect()
