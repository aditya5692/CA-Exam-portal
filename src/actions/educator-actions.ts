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

function isAdminUser(user: { role: string }) {
    return user.role === "ADMIN";
}

async function getAvailableEducators() {
    return prisma.user.findMany({
        where: {
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
        },
        orderBy: [
            { fullName: "asc" },
            { email: "asc" },
        ],
    });
}

async function resolveManagedOwnerId(actor: { id: string; role: string }, requestedOwnerId: string | null) {
    if (!isAdminUser(actor)) {
        return actor.id;
    }

    if (!requestedOwnerId) {
        return actor.id;
    }

    const educator = await prisma.user.findFirst({
        where: {
            id: requestedOwnerId,
            role: {
                in: ["TEACHER", "ADMIN"],
            },
        },
        select: { id: true },
    });

    if (!educator) {
        throw new Error("Selected educator was not found.");
    }

    return educator.id;
}

export async function publishMaterial(formData: FormData) {
    try {
        const file = formData.get("file") as File | null;
        const studentEmailsStr = String(formData.get("studentEmails") ?? "");
        // New: comma-separated batch IDs for batch-based distribution
        const batchIdsStr = String(formData.get("batchIds") ?? "");
        const title = String(formData.get("title") ?? file?.name ?? "").trim();
        const isProtected = formData.get("isProtected") === "true";

        if (!file) throw new Error("No file provided");

        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "share");

        const ownerId = await resolveManagedOwnerId(
            teacher,
            String(formData.get("ownerId") ?? "").trim() || null,
        );

        const uploadDir = join(process.cwd(), "public", "uploads", "teacher_materials");
        await mkdir(uploadDir, { recursive: true }).catch(() => { });

        const fileExt = file.name.split(".").pop() || "tmp";
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const fileUrl = `/uploads/teacher_materials/${fileName}`;

        const material = await prisma.studyMaterial.create({
            data: {
                title: title || file.name,
                fileUrl,
                fileType: file.type,
                sizeInBytes: file.size,
                isPublic: false,
                isProtected,
                uploadedById: ownerId,
            },
        });

        // ── Batch-based distribution (preferred over email) ─────────────────
        if (batchIdsStr) {
            const batchIds = batchIdsStr.split(",").map((id) => id.trim()).filter(Boolean);

            // Verify teacher owns these batches (admin can use any)
            const validBatches = await prisma.batch.findMany({
                where: {
                    id: { in: batchIds },
                    ...(isAdminUser(teacher) ? {} : { teacherId: teacher.id }),
                },
                select: { id: true },
            });
            const validBatchIds = validBatches.map((b) => b.id);

            if (validBatchIds.length > 0) {
                // Get all students enrolled in these batches
                const enrollments = await prisma.enrollment.findMany({
                    where: { batchId: { in: validBatchIds } },
                    select: { studentId: true },
                });
                const studentIds = [...new Set(enrollments.map((e) => e.studentId))];

                if (studentIds.length > 0) {
                    await prisma.$transaction(
                        studentIds.map((studentId) =>
                            prisma.materialAccess.upsert({
                                where: { studentId_materialId: { studentId, materialId: material.id } },
                                update: { accessType: "FREE_BATCH_MATERIAL" },
                                create: { studentId, materialId: material.id, accessType: "FREE_BATCH_MATERIAL" },
                            }),
                        ),
                    );
                }
            }
        } else if (studentEmailsStr) {
            // ── Fallback: email-based distribution ──────────────────────────
            const emails = studentEmailsStr
                .split(",")
                .map((email) => email.trim())
                .filter(Boolean);

            const students = await prisma.user.findMany({ where: { email: { in: emails } } });

            if (students.length > 0) {
                await prisma.$transaction(
                    students.map((student) =>
                        prisma.materialAccess.upsert({
                            where: { studentId_materialId: { studentId: student.id, materialId: material.id } },
                            update: { accessType: "FREE_BATCH_MATERIAL" },
                            create: { studentId: student.id, materialId: material.id, accessType: "FREE_BATCH_MATERIAL" },
                        }),
                    ),
                );
            }
        }

        revalidatePath("/admin/dashboard");
        revalidatePath("/teacher/materials");
        revalidatePath("/student/materials");
        return { success: true, material };
    } catch (error: unknown) {
        console.error("Publish error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to publish material." };
    }
}

// ── Get teacher's batches for the material publish picker ─────────────────────
export async function getTeacherBatchesForMaterials() {
    try {
        const teacher = await getOrCreateMockTeacher();
        const batches = await prisma.batch.findMany({
            where: isAdminUser(teacher) ? undefined : { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                _count: { select: { enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return {
            success: true,
            batches: batches.map((b) => ({ id: b.id, name: b.name, studentCount: b._count.enrollments })),
        };
    } catch {
        return { success: false, batches: [] };
    }
}

export async function getTeacherMaterials() {
    try {
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "read");

        const isAdminView = isAdminUser(teacher);
        const materials = await prisma.studyMaterial.findMany({
            where: isAdminView
                ? { fileUrl: { startsWith: "/uploads/teacher_materials/" } }
                : {
                    uploadedById: teacher.id,
                    fileUrl: { startsWith: "/uploads/teacher_materials/" },
                },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                    },
                },
                accessedBy: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            materials,
            isAdminView,
            availableEducators: isAdminView ? await getAvailableEducators() : [],
        };
    } catch (error: unknown) {
        console.error("Fetch error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch materials." };
    }
}

export async function getStudentSharedMaterials(studentId?: string) {
    try {
        const viewer = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
        await assertUserCanAccessFeature(viewer.id, "STUDENT_MATERIALS", "read");

        if (studentId) {
            if (viewer.role !== "ADMIN" && viewer.id !== studentId) {
                throw new Error("Unauthorized student lookup.");
            }

            const targetStudent = await prisma.user.findUnique({ where: { id: studentId } });
            if (!targetStudent) throw new Error("Student not found");

            const accesses = await prisma.materialAccess.findMany({
                where: { studentId: targetStudent.id },
                include: {
                    material: {
                        include: {
                            uploadedBy: { select: { fullName: true, email: true } },
                        },
                    },
                },
                orderBy: { grantedAt: "desc" },
            });

            return {
                success: true,
                materials: accesses.map((access) => access.material),
                isAdminView: viewer.role === "ADMIN",
            };
        }

        if (viewer.role === "ADMIN") {
            const materials = await prisma.studyMaterial.findMany({
                where: {
                    fileUrl: { startsWith: "/uploads/teacher_materials/" },
                    accessedBy: {
                        some: {},
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
                    accessedBy: {
                        include: {
                            student: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            return { success: true, materials, isAdminView: true };
        }

        const accesses = await prisma.materialAccess.findMany({
            where: { studentId: viewer.id },
            include: {
                material: {
                    include: {
                        uploadedBy: { select: { fullName: true, email: true } },
                    },
                },
            },
            orderBy: { grantedAt: "desc" },
        });

        return { success: true, materials: accesses.map((access) => access.material), isAdminView: false };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch shared materials." };
    }
}

