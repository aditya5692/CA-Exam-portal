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
    category?: string;
    subType?: string;
    isProtected: boolean;
    isPublic: boolean;
    batchIds: string[];
    studentEmails: string[];
    accessType?: string;
};

export async function createSharedTeacherMaterial(input: SharedTeacherMaterialInput) {
    return withSerializableTransaction(async (tx) => {
        await assertStorageCapacity(tx, input.ownerId, input.fileSize);

        let targetStudentIds: string[] = [];
        let validatedBatchIds: string[] = [];

        if (input.batchIds.length > 0) {
            const validBatches = await tx.batch.findMany({
                where: {
                    id: { in: input.batchIds },
                    ...(isAdminUser(input.actor) ? {} : { teacherId: input.actor.id }),
                },
                select: { id: true },
            });

            if (validBatches.length === 0 && input.batchIds.length > 0) {
                 throw new Error("No valid batches found or you do not have permission.");
            }
            validatedBatchIds = validBatches.map(b => b.id);
        }

        if (input.studentEmails.length > 0) {
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
                category: input.category?.trim() || "GENERAL",
                subType: input.subType?.trim() || "PDF",
                isProtected: input.isProtected,
                isPublic: input.isPublic,
                providerType: "TEACHER",
                uploadedById: input.ownerId,
            },
        });

        await incrementStorageUsed(tx, input.ownerId, input.fileSize);

        // 1. Link to Batches (Dynamic Access)
        if (validatedBatchIds.length > 0) {
            for (const batchId of validatedBatchIds) {
                await tx.batchMaterial.create({
                    data: {
                        batchId,
                        materialId: material.id
                    }
                });
            }
        }

        // 2. Link to Specific Students (Static Access)
        if (targetStudentIds.length > 0) {
            const accessType = input.accessType ?? "DIRECT_STUDENT_SHARE";
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
