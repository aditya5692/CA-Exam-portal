"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { requireAuth } from "@/lib/auth/session";
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
import {
  TeacherMaterialWithRelations,
  TeacherMaterialsData,
  TeacherOverviewData,
} from "@/types/educator";
import { ActionResponse } from "@/types/shared";
import { Prisma,type StudyMaterial } from "@prisma/client";
import { educatorMaterialSchema, educatorPyqSchema } from "@/lib/validations/resource-schemas";

async function requireTeacher() {
    return requireAuth(["TEACHER", "ADMIN"]);
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
            return { success: false, message: validated.error.issues[0].message };
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
        const teacher = await requireTeacher();
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


/**
 * Fetches all materials uploaded by the current teacher.
 */
export async function getTeacherMaterials(): Promise<ActionResponse<TeacherMaterialsData>> {
    try {
        const teacher = await requireTeacher();
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
        const viewer = await requireAuth(["STUDENT", "TEACHER", "ADMIN"]);
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
        const teacher = await requireTeacher();
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
            return { success: false, message: validated.error.issues[0].message };
        }

        const { title, category, description } = validated.data;

        const teacher = await requireAuth(["TEACHER", "ADMIN"]);
        await assertUserCanAccessFeature(teacher.id, "TEACHER_MATERIALS", "create");
        
        const savedFile = await saveUploadedFile(file, ["pyqs"], "pdf");
        savedFileUrl = savedFile.fileUrl;
        
        const material = await createOwnedStudyMaterial({
            title: title || file.name,
            description: description ?? "",
            fileUrl: savedFile.fileUrl,
            fileType: file.type || "application/pdf",
            sizeInBytes: file.size,
            isPublic: true,
            category: category,
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
        const teacher = await requireTeacher();
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
        revalidateMaterialSurfaces();
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
        const teacher = await requireTeacher();
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

/**
 * Fetches detailed analytics data for the teacher analytics page.
 * All queries are scoped to the authenticated teacher's own exams + batches.
 */
export async function getTeacherAnalyticsData(): Promise<ActionResponse<{
    stats: {
        totalAttempts: number;
        avgScore: number;
        passRate: number;
        activeStudents: number;
        totalExams: number;
        publishedExams: number;
    };
    trends: { name: string; attempts: number; score: number }[];
    examPerformance: { title: string; attempts: number; avgScore: number; passRate: number; subject: string }[];
    atRiskStudents: { name: string; score: number; deviation: number; status: string; attempts: number }[];
    subjectAccuracy: { subject: string; accuracy: number; attempts: number }[];
    topStudents: { name: string; xp: number; rank: number; level: number; avgScore: number }[];
    teacherName: string;
}>> {
    try {
        const teacher = await requireTeacher();
        const teacherId = teacher.id;

        const isAdmin = teacher.role === "ADMIN";

        // ── 1. All teacher exams ──────────────────────────────────────────
        const teacherExams = await prisma.exam.findMany({
            where: isAdmin ? {} : { teacherId },
            select: { id: true, title: true, totalMarks: true, passingMarks: true, subject: true, status: true },
        });
        const examIds = teacherExams.map(e => e.id);

        // ── 2. All submitted attempts for teacher's exams ─────────────────
        const allAttempts = await prisma.examAttempt.findMany({
            where: { examId: { in: examIds }, status: "SUBMITTED" },
            select: {
                id: true,
                score: true,
                startTime: true,
                endTime: true,
                studentId: true,
                examId: true,
                student: { select: { id: true, fullName: true, email: true } },
                exam: { select: { totalMarks: true, passingMarks: true } },
            },
            orderBy: { startTime: "desc" },
        });

        const totalAttempts = allAttempts.length;

        // ── 3. Global stats ───────────────────────────────────────────────
        let totalScorePct = 0;
        let passCount = 0;
        const uniqueStudentIds = new Set<string>();

        allAttempts.forEach(a => {
            const pct = a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0;
            totalScorePct += pct;
            if (a.exam.passingMarks > 0 && a.score >= a.exam.passingMarks) passCount++;
            else if (a.exam.passingMarks === 0 && pct >= 40) passCount++; // default 40%
            uniqueStudentIds.add(a.studentId);
        });

        const avgScore = totalAttempts > 0 ? Math.round((totalScorePct / totalAttempts) * 10) / 10 : 0;
        const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;

        // ── 4. 7-day attempt trends ───────────────────────────────────────
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const trends = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split("T")[0];
            const dayAttempts = allAttempts.filter(a => a.startTime.toISOString().split("T")[0] === dateStr);
            const dayAvg = dayAttempts.length > 0
                ? dayAttempts.reduce((acc, a) => acc + (a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0), 0) / dayAttempts.length
                : 0;
            return { name: dayNames[d.getDay()], attempts: dayAttempts.length, score: Math.round(dayAvg) };
        });

        // ── 5. Per-exam performance breakdown ────────────────────────────
        const examPerformance = teacherExams.map(exam => {
            const eAttempts = allAttempts.filter(a => a.examId === exam.id);
            const eTotal = eAttempts.length;
            const eAvg = eTotal > 0
                ? eAttempts.reduce((acc, a) => acc + (exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0), 0) / eTotal
                : 0;
            const ePassed = eAttempts.filter(a => exam.passingMarks > 0 ? a.score >= exam.passingMarks : (exam.totalMarks > 0 ? (a.score / exam.totalMarks) * 100 : 0) >= 40).length;
            return {
                title: exam.title,
                subject: exam.subject || "General",
                attempts: eTotal,
                avgScore: Math.round(eAvg * 10) / 10,
                passRate: eTotal > 0 ? Math.round((ePassed / eTotal) * 100) : 0,
            };
        }).filter(e => e.attempts > 0).sort((a, b) => b.attempts - a.attempts).slice(0, 8);

        // ── 6. At-risk students (below class avg by >10%) ─────────────────
        const classAvg = avgScore;
        const studentScoreMap = new Map<string, { name: string; scores: number[]; attempts: number }>();
        allAttempts.forEach(a => {
            const pct = a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0;
            const key = a.studentId;
            if (!studentScoreMap.has(key)) {
                studentScoreMap.set(key, { name: a.student.fullName || a.student.email || "Unknown", scores: [], attempts: 0 });
            }
            const entry = studentScoreMap.get(key)!;
            entry.scores.push(pct);
            entry.attempts++;
        });

        const atRiskStudents = Array.from(studentScoreMap.entries()).map(([, s]) => {
            const sAvg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
            const deviation = Math.round(sAvg - classAvg);
            return {
                name: s.name,
                score: Math.round(sAvg),
                deviation,
                attempts: s.attempts,
                status: deviation < -15 ? "Critical" : deviation < -5 ? "Watch" : "Safe",
            };
        }).filter(s => s.status !== "Safe").sort((a, b) => a.deviation - b.deviation).slice(0, 6);

        // ── 7. Subject accuracy from TopicProgress (across teacher's batches) ──
        const batches = await prisma.batch.findMany({
            where: { teacherId },
            select: { id: true, enrollments: { select: { studentId: true } } },
        });
        const batchStudentIds = Array.from(new Set(batches.flatMap(b => b.enrollments.map(e => e.studentId))));

        const topicProgressRows = await prisma.topicProgress.findMany({
            where: { studentId: { in: batchStudentIds }, totalAttempted: { gt: 0 } },
            select: { subject: true, totalAttempted: true, totalCorrect: true },
        });

        const subjectMap = new Map<string, { correct: number; attempted: number }>();
        topicProgressRows.forEach(row => {
            const existing = subjectMap.get(row.subject) ?? { correct: 0, attempted: 0 };
            existing.correct += row.totalCorrect;
            existing.attempted += row.totalAttempted;
            subjectMap.set(row.subject, existing);
        });

        const subjectAccuracy = Array.from(subjectMap.entries())
            .map(([subject, { correct, attempted }]) => ({
                subject,
                accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0,
                attempts: attempted,
            }))
            .sort((a, b) => b.attempts - a.attempts)
            .slice(0, 8);

        // ── 8. Top students by XP ────────────────────────────────────────
        const topProfilesRaw = await prisma.studentLearningProfile.findMany({
            where: { studentId: { in: batchStudentIds } },
            orderBy: { totalXP: "desc" },
            take: 5,
            include: { student: { select: { fullName: true, email: true } } },
        });

        const topStudents = topProfilesRaw.map((p, i) => {
            const sAttempts = allAttempts.filter(a => a.studentId === p.studentId);
            const sAvg = sAttempts.length > 0
                ? sAttempts.reduce((acc, a) => acc + (a.exam.totalMarks > 0 ? (a.score / a.exam.totalMarks) * 100 : 0), 0) / sAttempts.length
                : 0;
            return {
                name: p.student.fullName || p.student.email || "Student",
                xp: p.totalXP,
                rank: i + 1,
                level: p.level,
                avgScore: Math.round(sAvg),
            };
        });

        return {
            success: true,
            data: {
                stats: {
                    totalAttempts,
                    avgScore,
                    passRate,
                    activeStudents: uniqueStudentIds.size,
                    totalExams: teacherExams.length,
                    publishedExams: teacherExams.filter(e => e.status === "PUBLISHED").length,
                },
                trends,
                examPerformance,
                atRiskStudents,
                subjectAccuracy,
                topStudents,
                teacherName: teacher.fullName || "Educator",
            },
        };
    } catch (error) {
        console.error("getTeacherAnalyticsData failed:", error);
        return { success: false, message: "Failed to fetch analytics data." };
    }
}

