import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Upserting sample users...");

  // 1. Student User
  const student = await prisma.user.upsert({
    where: { phone: "1123456789" },
    update: {
      fullName: "Sample Student",
      role: "STUDENT",
      registrationNumber: "STU-123456",
      plan: "FREE",
    },
    create: {
      phone: "1123456789",
      fullName: "Sample Student",
      role: "STUDENT",
      registrationNumber: "STU-123456",
      plan: "FREE",
    },
  });
  console.log("Created/Updated Student:", student.phone);

  // 2. Teacher (Super Admin) User
  const teacher = await prisma.user.upsert({
    where: { phone: "9987654321" },
    update: {
      fullName: "Super Admin",
      role: "TEACHER",
      registrationNumber: "TEA-987654",
      plan: "PRO",
      isSuperAdmin: true,
    },
    create: {
      phone: "9987654321",
      fullName: "Super Admin",
      role: "TEACHER",
      registrationNumber: "TEA-987654",
      plan: "PRO",
      isSuperAdmin: true,
    },
  });
  console.log("Created/Updated Teacher:", teacher.phone);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
