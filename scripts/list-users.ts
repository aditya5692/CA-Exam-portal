import { createRuntimePrismaClient } from "../src/lib/prisma/runtime";

async function main() {
    const { prisma } = createRuntimePrismaClient();
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            fullName: true,
            role: true
        },
        take: 10
    });
    console.log("Users in Database:");
    console.table(users);
    if (prisma.$disconnect) await prisma.$disconnect();
}

main();
