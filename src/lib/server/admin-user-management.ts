import "server-only";

import prisma from "@/lib/prisma/client";
import { withSerializableTransaction } from "./action-utils";

export async function ensureManagedUserRecord(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, registrationNumber: true },
    });

    if (!user) {
        throw new Error("User not found.");
    }

    return user;
}

export async function assertManagedUserIdentityAvailability(
    email: string | null,
    registrationNumber: string | null,
    excludeUserId?: string,
) {
    if (email) {
        const existingByEmail = await prisma.user.findFirst({
            where: {
                email,
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
            },
            select: { id: true },
        });

        if (existingByEmail) {
            throw new Error("A user with this email already exists.");
        }
    }

    if (registrationNumber) {
        const existingByRegistration = await prisma.user.findFirst({
            where: {
                registrationNumber,
                ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
            },
            select: { id: true },
        });

        if (existingByRegistration) {
            throw new Error("A user with this registration number already exists.");
        }
    }
}

export async function deleteManagedUserAndCollectFiles(userId: string) {
    return withSerializableTransaction(async (tx) => {
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error("User not found.");
        }

        const uploadedMaterials = await tx.studyMaterial.findMany({
            where: { uploadedById: userId },
            select: { id: true, fileUrl: true },
        });
        const uploadedMaterialIds = uploadedMaterials.map((material) => material.id);

        const teacherBatchIds = (
            await tx.batch.findMany({
                where: { teacherId: userId },
                select: { id: true },
            })
        ).map((batch) => batch.id);

        const teacherExamIds = (
            await tx.exam.findMany({
                where: { teacherId: userId },
                select: { id: true },
            })
        ).map((exam) => exam.id);

        if (teacherBatchIds.length > 0) {
            await tx.exam.updateMany({
                where: { batchId: { in: teacherBatchIds } },
                data: { batchId: null },
            });
        }

        if (teacherExamIds.length > 0) {
            await tx.examAttempt.deleteMany({
                where: { examId: { in: teacherExamIds } },
            });

            await tx.exam.deleteMany({
                where: { id: { in: teacherExamIds } },
            });
        }

        await tx.examAttempt.deleteMany({
            where: { studentId: userId },
        });

        await tx.materialAccess.deleteMany({
            where: { studentId: userId },
        });

        if (uploadedMaterialIds.length > 0) {
            await tx.materialAccess.deleteMany({
                where: { materialId: { in: uploadedMaterialIds } },
            });
        }

        await tx.studyMaterial.deleteMany({
            where: { uploadedById: userId },
        });

        await tx.enrollment.deleteMany({
            where: { studentId: userId },
        });

        await tx.announcement.deleteMany({
            where: { teacherId: userId },
        });

        await tx.batch.deleteMany({
            where: { teacherId: userId },
        });

        await tx.draftMCQ.deleteMany({
            where: { teacherId: userId },
        });

        while (true) {
            const deletedLeafFolders = await tx.folder.deleteMany({
                where: {
                    ownerId: userId,
                    subFolders: { none: {} },
                },
            });

            if (deletedLeafFolders.count === 0) {
                break;
            }
        }

        await tx.folder.deleteMany({
            where: { ownerId: userId },
        });

        await tx.user.delete({
            where: { id: userId },
        });

        return uploadedMaterials.map((material) => material.fileUrl);
    });
}
