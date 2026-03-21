import { randomUUID } from "crypto";

import { createPasswordHash,type AppRole } from "@/lib/auth/demo-accounts";
import prisma from "@/lib/prisma/client";
import type { User } from "@prisma/client";

type CreateTestUserInput = {
    role: AppRole;
    fullName?: string;
    email?: string | null;
    registrationNumber?: string;
    department?: string | null;
    password?: string;
    plan?: string;
    storageLimit?: number;
    isBlocked?: boolean;
    blockedReason?: string | null;
};

function createUserSeed(role: AppRole) {
    const token = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
    const prefix = role === "ADMIN" ? "ADM" : role === "TEACHER" ? "TCH" : "STD";

    return {
        token,
        registrationNumber: `${prefix}${token}`,
        email: `${role.toLowerCase()}.${token.toLowerCase()}@integration.local`,
    };
}

export async function resetIntegrationDatabase() {
    await prisma.materialAccess.deleteMany();
    await prisma.savedItem.deleteMany();
    await prisma.studentAnswer.deleteMany();
    await prisma.examAttempt.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.option.deleteMany();
    await prisma.question.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.batch.deleteMany();
    await prisma.draftMCQ.deleteMany();
    await prisma.topicProgress.deleteMany();
    await prisma.xPEvent.deleteMany();
    await prisma.studentLearningProfile.deleteMany();
    await prisma.userFeatureAccess.deleteMany();
    await prisma.studyMaterial.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
}

export async function disconnectIntegrationDatabase() {
    await prisma.$disconnect();
}

export async function createTestUser(input: CreateTestUserInput): Promise<User> {
    const seed = createUserSeed(input.role);
    const registrationNumber = input.registrationNumber?.trim().toUpperCase() || seed.registrationNumber;
    const email = input.email === undefined
        ? seed.email
        : input.email?.trim().toLowerCase() || null;
    const fullName = input.fullName?.trim() || `${input.role} ${seed.token}`;
    const password = input.password?.trim() || "Password123!";

    return prisma.user.create({
        data: {
            fullName,
            email,
            registrationNumber,
            department: input.department?.trim() || `${input.role} Department`,
            role: input.role,
            plan: input.plan ?? (input.role === "STUDENT" ? "ELITE" : "PRO"),
            storageLimit: input.storageLimit ?? 1_000_000,
            isBlocked: input.isBlocked ?? false,
            blockedReason: input.blockedReason ?? null,
            passwordHash: createPasswordHash(password, registrationNumber),
        },
    });
}

export async function countRows() {
    const [
        userCount,
        batchCount,
        enrollmentCount,
        materialCount,
        examCount,
        attemptCount,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.batch.count(),
        prisma.enrollment.count(),
        prisma.studyMaterial.count(),
        prisma.exam.count(),
        prisma.examAttempt.count(),
    ]);

    return {
        userCount,
        batchCount,
        enrollmentCount,
        materialCount,
        examCount,
        attemptCount,
    };
}
