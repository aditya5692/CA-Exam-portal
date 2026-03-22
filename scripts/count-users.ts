import { createRuntimePrismaClient } from "../src/lib/prisma/runtime";

async function main() {
    try {
        const { prisma } = createRuntimePrismaClient(process.env);
        const count = await prisma.user.count();
        console.log(`Total users in DB: ${count}`);
        
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true },
            take: 5
        });
        console.table(users);
        if (prisma.$disconnect) await prisma.$disconnect();
    } catch (err) {
        console.error("Failed to connect or query:", err);
    }
}

main();
