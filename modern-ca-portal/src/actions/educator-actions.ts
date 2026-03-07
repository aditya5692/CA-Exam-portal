"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

async function getOrCreateMockTeacher() {
    return getCurrentUserOrDemoUser("TEACHER");
}

export async function publishMaterial(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        const studentEmailsStr = formData.get("studentEmails") as string;
        const title = formData.get("title") as string || file.name;
        const isProtected = formData.get("isProtected") === "true";

        if (!file) throw new Error("No file provided");

        const teacher = await getOrCreateMockTeacher();

        // 1. Save file locally
        const uploadDir = join(process.cwd(), "public", "uploads", "teacher_materials");
        await mkdir(uploadDir, { recursive: true }).catch(() => { });

        const fileExt = file.name.split('.').pop() || 'tmp';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const fileUrl = `/uploads/teacher_materials/${fileName}`;

        // 2. Create the protected study material record
        const material = await prisma.studyMaterial.create({
            data: {
                title,
                fileUrl,
                fileType: file.type,
                sizeInBytes: file.size,
                isPublic: false,
                isProtected, // Prevent downloads
                uploadedById: teacher.id
            }
        });

        // 3. Grant access to explicitly listed students
        if (studentEmailsStr) {
            const emails = studentEmailsStr.split(',').map(e => e.trim());
            const students = await prisma.user.findMany({
                where: { email: { in: emails } }
            });

            if (students.length > 0) {
                const accessData = students.map(student => ({
                    studentId: student.id,
                    materialId: material.id,
                    accessType: "FREE_BATCH_MATERIAL"
                }));

                await prisma.materialAccess.createMany({
                    data: accessData
                });
            }
        }

        revalidatePath('/teacher/hub');
        return { success: true, material };

    } catch (error: unknown) {
        console.error("Publish error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to publish material." };
    }
}

export async function getTeacherMaterials() {
    try {
        const teacher = await getOrCreateMockTeacher();

        const materials = await prisma.studyMaterial.findMany({
            where: {
                uploadedById: teacher.id
            },
            include: {
                accessedBy: {
                    include: {
                        student: { select: { fullName: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return { success: true, materials };
    } catch (error: unknown) {
        console.error("Fetch error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch materials." };
    }
}

export async function getStudentSharedMaterials(studentId?: string) {
    try {
        const student = studentId
            ? await prisma.user.findUnique({ where: { id: studentId } })
            : await getCurrentUserOrDemoUser("STUDENT");

        if (!student) throw new Error("Student not found");

        const accesses = await prisma.materialAccess.findMany({
            where: { studentId: student.id },
            include: {
                material: {
                    include: {
                        uploadedBy: { select: { fullName: true } }
                    }
                }
            },
            orderBy: { grantedAt: 'desc' }
        });

        return { success: true, materials: accesses.map(a => a.material) };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch shared materials." };
    }
}
