const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const exams = await prisma.exam.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      subject: true,
      status: true
    }
  });
  console.log(JSON.stringify(exams, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
