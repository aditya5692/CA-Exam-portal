const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const exams = await prisma.exam.findMany({
      select: { title: true, category: true, subject: true, status: true }
    })
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { fullName: true, registrationNumber: true, examTarget: true }
    })
    
    console.log('--- EXAMS IN DB ---')
    console.log(JSON.stringify(exams, null, 2))
    console.log('--- STUDENTS IN DB ---')
    console.log(JSON.stringify(students, null, 2))
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
