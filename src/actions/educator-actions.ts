"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { Prisma, type StudyMaterial, type User } from "@prisma/client";
import prisma from "@/lib/prisma/client";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/shared";

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
    try {
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
    } catch (error) {
        console.error("resolveManagedOwnerId failed:", error);
        throw error;
    }
}

/**
 * Publishes a study material and distributes it to batches or specific students.
 */
export async function publishMaterial(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<{}>>> {
    try {
        const file = formData.get("file");
        const studentEmailsStr = String(formData.get("studentEmails") ?? "");
        const batchIdsStr = String(formData.get("batchIds") ?? "");
        
        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format");
        }

        const title = String(formData.get("title") ?? file.name ?? "").trim();
        const isProtected = formData.get("isProtected") === "true";

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
                providerType: "TEACHER",
                category: String(formData.get("category") ?? "GENERAL").trim(),
            } as Prisma.StudyMaterialUncheckedCreateInput,
        });

        // ── Batch-based distribution ────────────────────────────────────────
        if (batchIdsStr) {
            const batchIds = batchIdsStr.split(",").map((id) => id.trim()).filter(Boolean);

            const validBatches = await prisma.batch.findMany({
                where: {
                    id: { in: batchIds },
                    ...(isAdminUser(teacher) ? {} : { teacherId: teacher.id }),
                },
                select: { id: true },
            });
            const validBatchIds = validBatches.map((b) => b.id);

            if (validBatchIds.length > 0) {
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
        return { success: true, data: material };
    } catch (error: unknown) {
        console.error("Publish error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to publish material." };
    }
}

/**
 * Fetches batches owned by or accessible to the current teacher.
 */
export async function getTeacherBatchesForMaterials(): Promise<ActionResponse<{ id: string, name: string, studentCount: number }[]>> {
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
            data: batches.map((b) => ({ id: b.id, name: b.name, studentCount: b._count.enrollments })),
        };
    } catch (error) {
        console.error("getTeacherBatchesForMaterials failed:", error);
        return { success: false, message: "Failed to fetch batches.", data: [] };
    }
}

export type TeacherMaterialWithRelations = Prisma.StudyMaterialGetPayload<{
    include: {
        uploadedBy: { select: { id: true, fullName: true, email: true, role: true } },
        accessedBy: { include: { student: { select: { id: true, fullName: true, email: true } } } }
    }
}>;

type TeacherMaterialsData = {
    materials: TeacherMaterialWithRelations[];
    isAdminView: boolean;
    availableEducators: { id: string; fullName: string | null; email: string | null; role: string }[];
};

/**
 * Fetches all materials uploaded by the current teacher.
 */
export async function getTeacherMaterials(): Promise<ActionResponse<TeacherMaterialsData>> {
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
                    select: { id: true, fullName: true, email: true, role: true },
                },
                accessedBy: {
                    include: {
                        student: { select: { id: true, fullName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }) as TeacherMaterialWithRelations[];

        return {
            success: true,
            data: {
                materials,
                isAdminView,
                availableEducators: isAdminView ? await getAvailableEducators() : [],
            }
        };
    } catch (error: unknown) {
        console.error("Fetch error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch materials." };
    }
}

/**
 * Fetches materials shared with the current student or all materials for admins.
 */
export async function getStudentSharedMaterials(studentId?: string): Promise<ActionResponse<{ materials: StudyMaterial[], isAdminView: boolean }>> {
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
                data: {
                    materials: accesses.map((access) => access.material),
                    isAdminView: viewer.role === "ADMIN",
                }
            };
        }

        if (viewer.role === "ADMIN") {
            const materials = await prisma.studyMaterial.findMany({
                where: {
                    fileUrl: { startsWith: "/uploads/teacher_materials/" },
                    accessedBy: { some: {} },
                },
                include: {
                    uploadedBy: { select: { id: true, fullName: true, email: true } },
                    accessedBy: {
                        include: {
                            student: { select: { id: true, fullName: true, email: true } },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });

            return { success: true, data: { materials: materials as any as StudyMaterial[], isAdminView: true } };
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

        return { success: true, data: { materials: accesses.map((access) => access.material), isAdminView: false } };
    } catch (error: unknown) {
        console.error("getStudentSharedMaterials failed:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch shared materials." };
    }
}

/**
 * Fetches general resources for a teacher.
 */
export async function getTeacherResources(subType?: string): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<{}>[]>> {
    try {
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "read");

        const resources = await prisma.studyMaterial.findMany({
            where: {
                uploadedById: teacher.id,
                ...(subType ? { subType } : {})
            },
            orderBy: { createdAt: "desc" }
        });

        return { success: true, data: resources };
    } catch (error) {
        console.error("Failed to fetch teacher resources:", error);
        return { success: false, message: "Failed to fetch resources.", data: [] };
    }
}

/**
 * Uploads a Past Year Question (PYQ) document.
 */
export async function uploadPYQ(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<{}>>> {
    try {
        const file = formData.get("file");
        const title = String(formData.get("title") ?? "").trim();
        const category = String(formData.get("category") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();

        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format");
        }

        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "create");

        const uploadDir = join(process.cwd(), "public", "uploads", "pyqs");
        await mkdir(uploadDir, { recursive: true }).catch(() => { });

        const fileExt = file.name.split(".").pop() || "pdf";
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = join(uploadDir, fileName);

        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        const fileUrl = `/uploads/pyqs/${fileName}`;

        const material = await prisma.studyMaterial.create({
            data: {
                title: title || file.name,
                description,
                fileUrl,
                fileType: file.type,
                sizeInBytes: file.size,
                isPublic: true,
                category,
                subType: "PYQ",
                providerType: "TEACHER",
                uploadedById: teacher.id,
            } as Prisma.StudyMaterialUncheckedCreateInput,
        });

        revalidatePath("/teacher/past-year-questions");
        revalidatePath("/student/past-year-questions");
        return { success: true, data: material };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to upload." };
    }
}

/**
 * Deletes a PYQ material.
 */
export async function deletePYQ(id: string): Promise<ActionResponse<void>> {
    try {
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "delete");

        await prisma.studyMaterial.deleteMany({
            where: { 
                id,
                uploadedById: teacher.id
            }
        });

        revalidatePath("/teacher/past-year-questions");
        revalidatePath("/student/past-year-questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to delete." };
    }
}

export type TeacherOverviewData = {
    stats: {
        activeStudents: number;
        avgTestScore: number;
        avgTimePerTest: string;
        testsCompleted: number;
        activeStudentsTrend: number;
        avgScoreTrend: number;
    };
    trends: { name: string; attempts: number; score: number }[];
    recentActivity: { user: string; action: string; time: string; color: string }[];
    topStudents: { id: string; name: string; xp: number; rank: number; level: number }[];
    recentAnnouncements: { id: string; content: string; date: string; batchName: string }[];
    recentMaterials: { id: string; title: string; type: string; category: string; date: string }[];
    teacherName: string;
};

/**
 * Fetches overview metrics for the teacher dashboard.
 */
export async function getTeacherOverview(): Promise<ActionResponse<TeacherOverviewData>> {
    try {
        const teacher = await getOrCreateMockTeacher();
        const teacherId = teacher.id;

        // 1. Get stats
        const batches = await prisma.batch.findMany({
            where: { teacherId },
            include: { _count: { select: { enrollments: true } } }
        });
        const activeStudents = batches.reduce((acc, b) => acc + b._count.enrollments, 0);

        const teacherExams = await prisma.exam.findMany({
            where: { teacherId },
            select: { id: true }
        });
        const examIds = teacherExams.map(e => e.id);

        const attempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds }, status: "SUBMITTED" },
            select: { score: true, startTime: true, endTime: true, exam: { select: { totalMarks: true } } }
        });

        const totalAttempts = attempts.length;
        let totalScorePct = 0;
        let totalTime = 0;

        attempts.forEach(a => {
            if (a.exam.totalMarks > 0) {
                totalScorePct += (a.score / a.exam.totalMarks) * 100;
            }
            if (a.endTime) {
                totalTime += (a.endTime.getTime() - a.startTime.getTime()) / 1000;
            }
        });

        const avgScore = totalAttempts > 0 ? Math.round(totalScorePct / totalAttempts * 10) / 10 : 0;
        const avgTimeSec = totalAttempts > 0 ? totalTime / totalAttempts : 0;
        const avgTimeStr = `${Math.floor(avgTimeSec / 60)}m ${Math.round(avgTimeSec % 60)}s`;

        // 2. Trends (last 7 days)
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });

        const trends = last7Days.map(date => {
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            const dayAttempts = attempts.filter(a => a.startTime >= start && a.startTime <= end);
            const dayScore = dayAttempts.length > 0 
                ? dayAttempts.reduce((acc, a) => acc + (a.score / (a.exam.totalMarks || 1)) * 100, 0) / dayAttempts.length 
                : 0;
            return {
                name: days[date.getDay()],
                attempts: dayAttempts.length,
                score: Math.round(dayScore)
            };
        });

        // 3. Recent Activity
        const recentAttempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds } },
            orderBy: { startTime: "desc" },
            take: 4,
            include: { student: { select: { fullName: true } }, exam: { select: { title: true } } }
        });
        
        const recentActivity = recentAttempts.map(a => {
            const diff = Math.floor((new Date().getTime() - a.startTime.getTime()) / 60000);
            const timeStr = diff < 60 ? `${diff}m ago` : diff < 1440 ? `${Math.floor(diff / 60)}h ago` : `${Math.floor(diff / 1440)}d ago`;
            const colors = ["bg-indigo-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500"];
            return {
                user: a.student.fullName || "Unknown Student",
                action: `Attempted ${a.exam.title}`,
                time: timeStr,
                color: colors[Math.floor(Math.random() * colors.length)]
            };
        });

        // 4. Top Students (from teacher's batches)
        const batchIds = batches.map(b => b.id);
        const topStudentsRaw = await prisma.studentLearningProfile.findMany({
            where: {
                student: {
                    enrollments: {
                        some: { batchId: { in: batchIds } }
                    }
                }
            },
            take: 4,
            orderBy: { totalXP: "desc" },
            include: { student: { select: { fullName: true, id: true } } }
        });

        const topStudents = topStudentsRaw.map((p, i) => ({
            id: p.studentId,
            name: p.student.fullName || "Student",
            xp: p.totalXP,
            rank: i + 1,
            level: p.level
        }));

        // 5. Recent Announcements
        const recentAnnouncementsRaw = await prisma.announcement.findMany({
            where: { teacherId },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: { batch: { select: { name: true } } }
        });

        const recentAnnouncements = recentAnnouncementsRaw.map(a => ({
            id: a.id,
            content: a.content,
            date: new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            batchName: a.batch.name
        }));

        // 6. Recent Materials
        const recentMaterialsRaw = await prisma.studyMaterial.findMany({
            where: { uploadedById: teacherId },
            take: 4,
            orderBy: { createdAt: "desc" }
        });

        const recentMaterials = recentMaterialsRaw.map(m => ({
            id: m.id,
            title: m.title,
            type: m.subType || "PDF",
            category: m.category,
            date: new Date(m.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }));

        return {
            success: true,
            data: {
                stats: {
                    activeStudents,
                    avgTestScore: avgScore,
                    avgTimePerTest: avgTimeStr,
                    testsCompleted: totalAttempts,
                    activeStudentsTrend: 12.5, // Mock trend for now
                    avgScoreTrend: 5.2
                },
                trends,
                recentActivity,
                topStudents,
                recentAnnouncements,
                recentMaterials,
                teacherName: teacher.fullName || "Educator"
            }
        };
    } catch (error) {
        console.error("getTeacherOverview failed:", error);
        return { success: false, message: "Failed to fetch dashboard metrics." };
    }
}
