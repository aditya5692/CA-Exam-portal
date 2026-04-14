"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { withErrorHandler } from "@/lib/server/action-utils";
import { resolveManagedEducatorId } from "@/lib/server/educator-management";
import { revalidateMaterialSurfaces, revalidatePastYearQuestionSurfaces } from "@/lib/server/revalidation";
import { removeSavedFileByUrl, saveUploadedFile } from "@/lib/server/storage-utils";
import { 
    createOwnedStudyMaterial, 
    createSharedTeacherMaterial, 
    deleteStudyMaterialWithAccessCleanup, 
    splitCsvValues 
} from "@/lib/server/study-material-service";
import { EducatorService } from "@/lib/services/educator-service";
import { educatorMaterialSchema, educatorPyqSchema } from "@/lib/validations/resource-schemas";
import { ActionResponse } from "@/types/shared";
import { Prisma } from "@prisma/client";

async function requireTeacher() {
    return requireAuth(["TEACHER", "ADMIN"]);
}

export async function publishMaterial(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>>> {
    let savedFileUrl: string | null = null;
    return withErrorHandler(async () => {
        const file = formData.get("file");
        const batchIds = formData.getAll("batchIds").map(String);
        const studentEmailsStr = String(formData.get("studentEmails") ?? "");

        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format.");
        }

        const rawData = {
            title: formData.get("title") ?? file.name,
            category: formData.get("category") ?? "GENERAL",
            subType: formData.get("subType") ?? "PDF",
            isProtected: formData.get("isProtected"),
            isPublic: formData.get("isPublic"),
        };

        const validated = educatorMaterialSchema.safeParse(rawData);
        if (!validated.success) {
            throw new Error(validated.error.issues[0].message);
        }

        const { title, category, subType, isProtected, isPublic } = validated.data;
        const teacher = await requireTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "share");
        
        const ownerId = await resolveManagedEducatorId(
            teacher,
            String(formData.get("ownerId") ?? "").trim() || null,
        );

        const savedFile = await saveUploadedFile(file, ["teacher_materials"], "tmp");
        savedFileUrl = savedFile.fileUrl;

        try {
            const material = await createSharedTeacherMaterial({
                actor: teacher,
                ownerId,
                title: title || file.name,
                fileUrl: savedFile.fileUrl,
                fileType: file.type || "application/octet-stream",
                fileSize: file.size,
                category,
                subType,
                isProtected,
                isPublic,
                batchIds,
                studentEmails: splitCsvValues(studentEmailsStr),
            });

            revalidateMaterialSurfaces();
            return material;
        } catch (dbError) {
            await removeSavedFileByUrl(savedFileUrl);
            throw dbError;
        }
    }, "Failed to publish material.");
}

export async function getTeacherMaterials(): Promise<ActionResponse<any>> {
    return withErrorHandler(async () => {
        const teacher = await requireTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "read");
        return EducatorService.getTeacherMaterials(teacher);
    }, "Failed to fetch materials.");
}

export async function uploadPYQ(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>>> {
    let savedFileUrl: string | null = null;
    return withErrorHandler(async () => {
        const file = formData.get("file");
        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format.");
        }

        const rawData = {
            title: formData.get("title") ?? file.name,
            category: formData.get("category"),
            description: formData.get("description"),
        };

        const validated = educatorPyqSchema.safeParse(rawData);
        if (!validated.success) {
            throw new Error(validated.error.issues[0].message);
        }

        const { title, category, description } = validated.data;
        const teacher = await requireTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "create");

        const savedFile = await saveUploadedFile(file, ["pyqs"], "pdf");
        savedFileUrl = savedFile.fileUrl;

        try {
            const material = await createOwnedStudyMaterial({
                title: title || file.name,
                description: description ?? "",
                fileUrl: savedFile.fileUrl,
                fileType: file.type || "application/pdf",
                sizeInBytes: file.size,
                isPublic: true,
                category,
                subType: "PYQ",
                providerType: "TEACHER",
                uploadedById: teacher.id,
            });

            revalidatePastYearQuestionSurfaces();
            return material;
        } catch (dbError) {
            await removeSavedFileByUrl(savedFileUrl);
            throw dbError;
        }
    }, "Failed to upload.");
}

export async function deletePYQ(id: string): Promise<ActionResponse<void>> {
    return withErrorHandler(async () => {
        const teacher = await requireTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "delete");
        
        const deletedMaterial = await deleteStudyMaterialWithAccessCleanup(
            id.trim(),
            (material) => {
                const isAdmin = teacher.role === "ADMIN";
                if (!isAdmin && material.uploadedById !== teacher.id) {
                    throw new Error("You do not have permission to delete this material.");
                }
            },
        );

        await removeSavedFileByUrl(deletedMaterial.fileUrl);
        revalidatePastYearQuestionSurfaces();
        revalidateMaterialSurfaces();
    }, "Failed to delete.");
}

export async function getTeacherBatchesForMaterials(): Promise<ActionResponse<{ id: string, name: string, studentCount: number }[]>> {
    return withErrorHandler(async () => {
        const teacher = await requireTeacher();
        const isAdmin = teacher.role === "ADMIN";
        const batches = await prisma.batch.findMany({
            where: isAdmin ? undefined : { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                _count: { select: { enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return batches.map((b) => ({ id: b.id, name: b.name, studentCount: b._count.enrollments }));
    }, "Failed to fetch batches.");
}

export async function getTeacherResources(subType?: string): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>[]>> {
    return withErrorHandler(async () => {
        const teacher = await requireTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "read");

        return prisma.studyMaterial.findMany({
            where: {
                uploadedById: teacher.id,
                ...(subType ? { subType } : {})
            },
            orderBy: { createdAt: "desc" }
        });
    }, "Failed to fetch resources.");
}
