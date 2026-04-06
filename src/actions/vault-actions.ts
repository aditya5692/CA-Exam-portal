"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage,withSerializableTransaction } from "@/lib/server/action-utils";
import { revalidateMaterialSurfaces } from "@/lib/server/revalidation";
import {
  assertStorageCapacity,
  removeSavedFileByUrl,
  saveUploadedFile,
} from "@/lib/server/storage-utils";
import {
  createOwnedStudyMaterial,
  deleteStudyMaterialWithAccessCleanup,
} from "@/lib/server/study-material-service";
import { ActionResponse } from "@/types/shared";
import { Prisma } from "@prisma/client";

export async function requireVaultUser() {
    return requireAuth(["STUDENT", "ADMIN"]);
}

function isAdminUser(user: { role: string }) {
    return user.role === "ADMIN";
}

/**
 * Checks if a user has sufficient storage quota for an incoming file.
 */
export async function checkStorageQuota(userId: string, incomingSize: number): Promise<boolean> {
    try {
        await withSerializableTransaction(async (tx) => {
            await assertStorageCapacity(tx, userId, incomingSize);
            return true;
        });

        return true;
    } catch (error) {
        throw new Error(getActionErrorMessage(error, "Unable to verify storage quota."));
    }
}

/**
 * Uploads a personal study material to the user's vault.
 */
export async function uploadPersonalMaterial(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>>> {
    let savedFileUrl: string | null = null;

    try {
        const file = formData.get("file") as File | null;
        if (!file || !(file instanceof File)) throw new Error("No file provided");

        const user = await requireVaultUser();
        await assertUserCanAccessFeature(user.id, "STUDENT_MATERIALS", "create");

        if (isAdminUser(user)) {
            throw new Error("Admin cannot upload from the student vault surface. Use a student account for personal notes.");
        }

        const savedFile = await saveUploadedFile(file, ["vault"], "tmp");
        savedFileUrl = savedFile.fileUrl;

        const material = await createOwnedStudyMaterial({
            title: file.name,
            fileUrl: savedFile.fileUrl,
            fileType: file.type || "application/octet-stream",
            sizeInBytes: file.size,
            isPublic: false,
            isProtected: false,
            uploadedById: user.id,
        });

        revalidateMaterialSurfaces();
        return { success: true, data: material, message: "File uploaded successfully." };
    } catch (error: unknown) {
        console.error("uploadPersonalMaterial error:", error);
        if (savedFileUrl) {
            await removeSavedFileByUrl(savedFileUrl);
        }

        return { success: false, message: getActionErrorMessage(error, "Upload failed.") };
    }
}

type VaultMaterialWithOwner = Prisma.StudyMaterialGetPayload<{
    include: { uploadedBy: { select: { id: true, fullName: true, email: true } } }
}>;

/**
 * Result data for vault material retrieval.
 */
type VaultMaterialsData = {
    materials: VaultMaterialWithOwner[];
    storageUsed: number;
    storageLimit: number;
    managedStudentsCount: number;
    isAdminView: boolean;
};

/**
 * Fetches materials from the personal vault for the current user.
 */
export async function getMyVaultMaterials(): Promise<ActionResponse<VaultMaterialsData>> {
    try {
        const user = await requireVaultUser();
        await assertUserCanAccessFeature(user.id, "STUDENT_MATERIALS", "read");

        if (isAdminUser(user)) {
            const [personalMaterials, aggregate] = await Promise.all([
                prisma.studyMaterial.findMany({
                    where: {
                        uploadedBy: {
                            role: "STUDENT",
                        },
                    },
                    include: {
                        uploadedBy: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }),
                prisma.user.aggregate({
                    where: { role: "STUDENT" },
                    _count: { id: true },
                    _sum: {
                        storageLimit: true,
                        storageUsed: true,
                    },
                }),
            ]);

            return {
                success: true,
                data: {
                    materials: personalMaterials as VaultMaterialWithOwner[],
                    storageUsed: aggregate._sum.storageUsed ?? 0,
                    storageLimit: aggregate._sum.storageLimit ?? 0,
                    managedStudentsCount: aggregate._count.id,
                    isAdminView: true,
                }
            };
        }

        const personalMaterials = await prisma.studyMaterial.findMany({
            where: {
                uploadedById: user.id,
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: {
                materials: personalMaterials as VaultMaterialWithOwner[],
                storageUsed: user.storageUsed,
                storageLimit: user.storageLimit,
                managedStudentsCount: 1,
                isAdminView: false,
            }
        };
    } catch (error: unknown) {
        console.error("getMyVaultMaterials error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch vault materials." };
    }
}

/**
 * Deletes a personal material from the user's vault.
 */
export async function deletePersonalMaterial(materialId: string): Promise<ActionResponse<void>> {
    let removedFileUrl: string | null = null;

    try {
        const user = await requireVaultUser();
        await assertUserCanAccessFeature(user.id, "STUDENT_MATERIALS", "delete");
        const normalizedMaterialId = materialId.trim();
        if (!normalizedMaterialId) {
            throw new Error("Material id is required.");
        }

        const deletedMaterial = await deleteStudyMaterialWithAccessCleanup(
            normalizedMaterialId,
            (material) => {
                const canDelete = isAdminUser(user)
                    ? material.uploadedBy?.role === "STUDENT"
                    : material.uploadedById === user.id;

                if (!canDelete) {
                    throw new Error("Unauthorized or not found");
                }
            },
        );

        removedFileUrl = deletedMaterial.fileUrl;

        await removeSavedFileByUrl(removedFileUrl);

        revalidateMaterialSurfaces();
        return { success: true, message: "Material deleted successfully.", data: undefined };
    } catch (error: unknown) {
        console.error("deletePersonalMaterial error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to delete material.") };
    }
}
