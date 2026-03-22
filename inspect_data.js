const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const exams = await prisma.exam.findMany({
      select: {
        title: true,
        category: true,
        subject: true,
      }
    });
    
    const users = await prisma.user.findMany({
      where: {
        registrationNumber: { in: ['STUD001', 'STUD002'] }
      },
      select: {
        registrationNumber: true,
        fullName: true,
        examTarget: true
      }
    });

    console.log('--- EXAMS DATA ---');
    console.log(JSON.stringify(exams, null, 2));
    
    console.log('--- STUDENT DATA ---');
    console.log(JSON.stringify(users, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
