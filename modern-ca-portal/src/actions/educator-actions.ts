"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import prisma from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

async function getOrCreateMockTeacher() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

export async function publishMaterial(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        const studentEmailsStr = formData.get("studentEmails") as string;
        const title = formData.get("title") as string || file.name;
        const isProtected = formData.get("isProtected") === "true";

        if (!file) throw new Error("No file provided");

        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "share");

        const uploadDir = join(process.cwd(), "public", "uploads", "teacher_materials");
        await mkdir(uploadDir, { recursive: true }).catch(() => { });

        const fileExt = file.name.split('.').pop() || 'tmp';
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const fileUrl = `/uploads/teacher_materials/${fileName}`;

        const material = await prisma.studyMaterial.create({
            data: {
                title,
                fileUrl,
                fileType: file.type,
                sizeInBytes: file.size,
                isPublic: false,
                isProtected,
                uploadedById: teacher.id
            }
        });

        if (studentEmailsStr) {
            const emails = studentEmailsStr.split(',').map((email) => email.trim()).filter(Boolean);
            const students = await prisma.user.findMany({
                where: { email: { in: emails } }
            });

            if (students.length > 0) {
                await prisma.$transaction(
                    students.map((student) =>
                        prisma.materialAccess.upsert({
                            where: {
                                studentId_materialId: {
                                    studentId: student.id,
                                    materialId: material.id,
                                },
                            },
                            update: {
                                accessType: "FREE_BATCH_MATERIAL",
                            },
                            create: {
                                studentId: student.id,
                                materialId: material.id,
                                accessType: "FREE_BATCH_MATERIAL",
                            },
                        })
                    )
                );
            }
        }

        revalidatePath('/teacher/materials');
        revalidatePath('/student/materials');
        return { success: true, material };

    } catch (error: unknown) {
        console.error("Publish error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to publish material." };
    }
}

export async function getTeacherMaterials() {
    try {
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "read");

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
            : await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);

        if (!student) throw new Error("Student not found");
        await assertUserCanAccessFeature(student.id, "STUDENT_MATERIALS", "read");

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

        return { success: true, materials: accesses.map((access) => access.material) };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch shared materials." };
    }
}

