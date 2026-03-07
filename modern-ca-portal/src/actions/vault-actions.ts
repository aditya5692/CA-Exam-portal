"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

async function getOrCreateMockUser() {
    return getCurrentUserOrDemoUser("STUDENT");
}

export async function checkStorageQuota(userId: string, incomingSize: number) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { storageUsed: true, storageLimit: true }
    });

    if (!user) throw new Error("User not found");

    if (user.storageUsed + incomingSize > user.storageLimit) {
        throw new Error("Storage Limit Exceeded");
    }

    return true;
}

export async function uploadPersonalMaterial(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) throw new Error("No file provided");

        const user = await getOrCreateMockUser();

        await checkStorageQuota(user.id, file.size);

        // Save locally to public/uploads
        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch {
            // Ignore if exists
        }

        const fileExt = file.name.split('.').pop() || 'tmp';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/${fileName}`;

        // Create Database Record and update quota
        const [material] = await prisma.$transaction([
            prisma.studyMaterial.create({
                data: {
                    title: file.name,
                    fileUrl,
                    fileType: file.type,
                    sizeInBytes: file.size,
                    isPublic: false,
                    isProtected: false, // Personal files are not strictly protected like teacher files
                    uploadedById: user.id
                }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    storageUsed: {
                        increment: file.size
                    }
                }
            })
        ]);

        return { success: true, material };

    } catch (error: unknown) {
        console.error("Upload error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Upload failed." };
    }
}

export async function getMyVaultMaterials() {
    try {
        const user = await getOrCreateMockUser();

        // Fetch personal uploads strictly
        const personalMaterials = await prisma.studyMaterial.findMany({
            where: {
                uploadedById: user.id
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add shared teacher materials here later if applicable

        return { success: true, materials: personalMaterials, storageUsed: user.storageUsed, storageLimit: user.storageLimit };
    } catch (error: unknown) {
        console.error("Fetch error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch vault materials." };
    }
}

export async function deletePersonalMaterial(materialId: string) {
    try {
        const user = await getOrCreateMockUser();

        const material = await prisma.studyMaterial.findUnique({
            where: { id: materialId }
        });

        if (!material || material.uploadedById !== user.id) {
            throw new Error("Unauthorized or not found");
        }

        // In a real app we'd also delete the actual physical file from public/uploads here.

        await prisma.$transaction([
            prisma.studyMaterial.delete({
                where: { id: materialId }
            }),
            prisma.user.update({
                where: { id: user.id },
                data: {
                    storageUsed: {
                        decrement: material.sizeInBytes
                    }
                }
            })
        ]);

        return { success: true };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to delete material." };
    }
}
