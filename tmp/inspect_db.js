const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const exams = await prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        category: true,
        subject: true,
        status: true,
        examType: true,
        batchId: true
      }
    });
    console.log('--- EXAMS LIST ---');
    exams.forEach(e => {
      console.log(`Title: ${e.title} | Category: ${e.category} | Subject: ${e.subject} | Status: ${e.status} | Batch: ${e.batchId}`);
    });
    console.log('--- END ---');
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
