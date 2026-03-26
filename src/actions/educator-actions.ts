"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  isAdminUser,
  listManagedEducatorOptions,
  resolveManagedEducatorId,
} from "@/lib/server/educator-management";
import {
  revalidateMaterialSurfaces,
  revalidatePastYearQuestionSurfaces,
} from "@/lib/server/revalidation";
import {
  removeSavedFileByUrl,
  saveUploadedFile,
} from "@/lib/server/storage-utils";
import {
  createOwnedStudyMaterial,
  createSharedTeacherMaterial,
  deleteStudyMaterialWithAccessCleanup,
  splitCsvValues,
} from "@/lib/server/study-material-service";
import type {
  TeacherMaterialWithRelations,
  TeacherOverviewData,
} from "@/types/educator";
import { ActionResponse } from "@/types/shared";
import { Prisma,type StudyMaterial } from "@prisma/client";

async function getOrCreateMockTeacher() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

/**
 * Publishes a study material and distributes it to batches or specific students.
 */
export async function publishMaterial(
    formData: FormData
): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>>> {
    let savedFileUrl: string | null = null;
    try {
        const file = formData.get("file");
        const studentEmailsStr = String(formData.get("studentEmails") ?? "");
        const batchIdsStr = String(formData.get("batchIds") ?? "");
        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format.");
        }
        const title = String(formData.get("title") ?? file.name ?? "").trim();
        const category = String(formData.get("category") ?? "GENERAL").trim();
        const subType = String(formData.get("subType") ?? "PDF").trim();
        const isProtected = formData.get("isProtected") === "true";
        const isPublic = formData.get("isPublic") === "true";
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "share");
        const ownerId = await resolveManagedEducatorId(
            teacher,
            String(formData.get("ownerId") ?? "").trim() || null,
        );
        const savedFile = await saveUploadedFile(file, ["teacher_materials"], "tmp");
        savedFileUrl = savedFile.fileUrl;
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
            batchIds: splitCsvValues(batchIdsStr),
            studentEmails: splitCsvValues(studentEmailsStr),
        });
        revalidateMaterialSurfaces();
        return { success: true, data: material };
    } catch (error: unknown) {
        console.error("Publish error:", error);
        await removeSavedFileByUrl(savedFileUrl);
        return { success: false, message: getActionErrorMessage(error, "Failed to publish material.") };
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
                availableEducators: isAdminView ? await listManagedEducatorOptions() : [],
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

            return { success: true, data: { materials: materials as unknown as StudyMaterial[], isAdminView: true } };
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

        // Pull Model: Fetch materials for all batches the student is enrolled in
        const batchMaterials = await prisma.batchMaterial.findMany({
            where: {
                batch: {
                    enrollments: { some: { studentId: viewer.id } }
                }
            },
            include: {
                material: {
                    include: {
                        uploadedBy: { select: { fullName: true, email: true } },
                    },
                },
            }
        });

        // Pull Model: Fetch general materials from teachers where student redeemed an access code
        const accessCodes = await prisma.studentAccessCode.findMany({
            where: { studentId: viewer.id, status: "VERIFIED" },
            select: { teacherId: true }
        });
        const linkedTeacherIds = accessCodes.map((a: any) => a.teacherId);

        const generalTeacherMaterials = await prisma.studyMaterial.findMany({
            where: {
                uploadedById: { in: linkedTeacherIds },
                batches: { none: {} }, // Unbound materials from these teachers
            },
            include: {
                uploadedBy: { select: { fullName: true, email: true } },
            }
        });

        const allMaterials = [
            ...accesses.map((a) => a.material),
            ...batchMaterials.map((bm: (typeof batchMaterials)[number]) => bm.material),
            ...generalTeacherMaterials,
        ];

        // Deduplicate by ID
        const uniqueMaterials = Array.from(new Map(allMaterials.map(m => [m.id, m])).values());

        return { success: true, data: { materials: uniqueMaterials, isAdminView: false } };
    } catch (error: unknown) {
        console.error("getStudentSharedMaterials failed:", error);
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch shared materials." };
    }
}

/**
 * Fetches general resources for a teacher.
 */
export async function getTeacherResources(subType?: string): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>[]>> {
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
export async function uploadPYQ(formData: FormData): Promise<ActionResponse<Prisma.StudyMaterialGetPayload<Record<string, never>>>> {
    let savedFileUrl: string | null = null;
    try {
        const file = formData.get("file");
        const title = String(formData.get("title") ?? "").trim();
        const category = String(formData.get("category") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        if (!file || !(file instanceof File)) {
            throw new Error("No file provided or invalid file format.");
        }
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "create");
        const savedFile = await saveUploadedFile(file, ["pyqs"], "pdf");
        savedFileUrl = savedFile.fileUrl;
        const material = await createOwnedStudyMaterial({
            title: title || file.name,
            description,
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
        return { success: true, data: material };
    } catch (error) {
        console.error("Upload error:", error);
        await removeSavedFileByUrl(savedFileUrl);
        return { success: false, message: getActionErrorMessage(error, "Failed to upload.") };
    }
}
/**
 * Deletes a PYQ material.
 */
export async function deletePYQ(id: string): Promise<ActionResponse<void>> {
    try {
        const teacher = await getOrCreateMockTeacher();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "delete");
        const normalizedId = id.trim();
        if (!normalizedId) {
            throw new Error("Material id is required.");
        }
        const deletedMaterial = await deleteStudyMaterialWithAccessCleanup(
            normalizedId,
            (material) => {
                if (!isAdminUser(teacher) && material.uploadedById !== teacher.id) {
                    throw new Error("You do not have permission to delete this material.");
                }
            },
        );
        await removeSavedFileByUrl(deletedMaterial.fileUrl);
        revalidatePastYearQuestionSurfaces();
        return { success: true, data: undefined };
    } catch (error) {
        console.error("Delete error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to delete.") };
    }
}
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
