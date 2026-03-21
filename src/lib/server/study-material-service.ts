import "server-only";

import { Prisma } from "@prisma/client";
import { withSerializableTransaction } from "./action-utils";
import { type ManagedActor,isAdminUser } from "./educator-management";
import {
  assertStorageCapacity,
  decrementStorageUsed,
  incrementStorageUsed,
} from "./storage-utils";

export function splitCsvValues(input: string) {
    return Array.from(new Set(
        input
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
    ));
}

export async function createOwnedStudyMaterial(data: Prisma.StudyMaterialUncheckedCreateInput) {
    return withSerializableTransaction(async (tx) => {
        await assertStorageCapacity(tx, data.uploadedById, data.sizeInBytes);

        const material = await tx.studyMaterial.create({
            data,
        });

        await incrementStorageUsed(tx, data.uploadedById, data.sizeInBytes);
        return material;
    });
}

type SharedTeacherMaterialInput = {
    actor: ManagedActor;
    ownerId: string;
    title: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    isProtected: boolean;
    batchIds: string[];
    studentEmails: string[];
    accessType?: string;
};

export async function createSharedTeacherMaterial(input: SharedTeacherMaterialInput) {
    return withSerializableTransaction(async (tx) => {
        await assertStorageCapacity(tx, input.ownerId, input.fileSize);

        let targetStudentIds: string[] = [];

        if (input.batchIds.length > 0) {
            const validBatches = await tx.batch.findMany({
                where: {
                    id: { in: input.batchIds },
                    ...(isAdminUser(input.actor) ? {} : { teacherId: input.actor.id }),
                },
                select: { id: true },
            });

            if (validBatches.length !== input.batchIds.length) {
                throw new Error("One or more selected batches are invalid.");
            }

            const enrollments = await tx.enrollment.findMany({
                where: { batchId: { in: input.batchIds } },
                select: { studentId: true },
            });

            targetStudentIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.studentId)));
        } else if (input.studentEmails.length > 0) {
            const normalizedEmails = input.studentEmails.map((email) => email.toLowerCase());
            const students = await tx.user.findMany({
                where: {
                    email: { in: normalizedEmails },
                    role: "STUDENT",
                },
                select: { id: true },
            });

            if (students.length !== normalizedEmails.length) {
                throw new Error("One or more student emails could not be found.");
            }

            targetStudentIds = Array.from(new Set(students.map((student) => student.id)));
        }

        const material = await tx.studyMaterial.create({
            data: {
                title: input.title,
                fileUrl: input.fileUrl,
                fileType: input.fileType,
                sizeInBytes: input.fileSize,
                isProtected: input.isProtected,
                isPublic: false,
                providerType: "TEACHER",
                uploadedById: input.ownerId,
            },
        });

        await incrementStorageUsed(tx, input.ownerId, input.fileSize);

        if (targetStudentIds.length > 0) {
            const accessType = input.accessType ?? "FREE_BATCH_MATERIAL";
            await Promise.all(
                targetStudentIds.map((studentId) =>
                    tx.materialAccess.upsert({
                        where: {
                            studentId_materialId: {
                                studentId,
                                materialId: material.id,
                            },
                        },
                        update: {
                            accessType,
                        },
                        create: {
                            studentId,
                            materialId: material.id,
                            accessType,
                        },
                    }),
                ),
            );
        }

        return material;
    });
}

export type StudyMaterialDeletionRecord = {
    id: string;
    fileUrl: string;
    sizeInBytes: number;
    uploadedById: string;
    uploadedBy: {
        role: string;
    } | null;
};

export async function deleteStudyMaterialWithAccessCleanup(
    materialId: string,
    authorize?: (material: StudyMaterialDeletionRecord) => void | Promise<void>,
) {
    return withSerializableTransaction(async (tx) => {
        const material = await tx.studyMaterial.findUnique({
            where: { id: materialId },
            select: {
                id: true,
                fileUrl: true,
                sizeInBytes: true,
                uploadedById: true,
                uploadedBy: {
                    select: {
                        role: true,
                    },
                },
            },
        });

        if (!material) {
            throw new Error("Material not found.");
        }

        await authorize?.(material);

        await tx.materialAccess.deleteMany({
            where: { materialId: material.id },
        });

        await tx.studyMaterial.delete({
            where: { id: material.id },
        });

        await decrementStorageUsed(tx, material.uploadedById, material.sizeInBytes);
        return material;
    });
}
