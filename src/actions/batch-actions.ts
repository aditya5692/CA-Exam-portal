"use server";

import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import { getCurrentUserOrDemoUser, syncCurrentAuthSession } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  createBatchAnnouncements,
  createManagedBatch,
  deleteStudentEnrollment,
  ensureScopedBatchRecord,
  joinStudentToBatchByCode,
  updateManagedBatchById,
} from "@/lib/server/batch-management";
import { normalizeJoinCode } from "@/lib/server/batch-utils";
import {
  isAdminUser,
  listManagedEducatorOptions,
  resolveManagedEducatorId,
  type ManagedEducatorOption,
} from "@/lib/server/educator-management";
import { revalidateBatchSurfaces, revalidateProfileSurfaces } from "@/lib/server/revalidation";
import { ActionResponse } from "@/types/shared";
import { Prisma } from "@prisma/client";

type BatchRecord = Prisma.BatchGetPayload<Record<string, never>>;
type AnnouncementRecord = Prisma.AnnouncementGetPayload<Record<string, never>>;

type TeacherBatchWithRelations = Prisma.BatchGetPayload<{
    include: {
        teacher: {
            select: {
                id: true;
                fullName: true;
                email: true;
            };
        };
        enrollments: {
            include: {
                student: {
                    select: {
                        id: true;
                        fullName: true;
                        email: true;
                        registrationNumber: true;
                    };
                };
            };
        };
        announcements: {
            include: {
                teacher: {
                    select: {
                        id: true;
                        fullName: true;
                        email: true;
                    };
                };
            };
        };
        _count: {
            select: {
                enrollments: true;
                announcements: true;
            };
        };
    };
}>;

type TeacherBatchesData = {
    batches: TeacherBatchWithRelations[];
    isAdminView: boolean;
    availableTeachers: ManagedEducatorOption[];
};

type TeacherUpdateBatch = Prisma.BatchGetPayload<{
    select: {
        id: true;
        name: true;
        teacher: {
            select: {
                id: true;
                fullName: true;
                email: true;
            };
        };
        _count: {
            select: {
                enrollments: true;
            };
        };
    };
}>;

type TeacherUpdateAnnouncement = Prisma.AnnouncementGetPayload<{
    include: {
        teacher: {
            select: {
                id: true;
                fullName: true;
                email: true;
            };
        };
        batch: {
            select: {
                id: true;
                name: true;
                teacher: {
                    select: {
                        id: true;
                        fullName: true;
                        email: true;
                    };
                };
            };
        };
    };
}>;

type TeacherUpdatesData = {
    batches: TeacherUpdateBatch[];
    announcements: TeacherUpdateAnnouncement[];
    isAdminView: boolean;
};

type PostAnnouncementData = {
    announcements: AnnouncementRecord[];
    postedCount: number;
};

type TeacherStudentSummary = {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
    department: string;
    status: string;
    joinedAt: Date;
    batchNames: string[];
    batchIds: string[];
    batchCodes: string[];
    batchOwners: string[];
    attemptDue: string;
};

type TeacherStudentsData = {
    isAdminView: boolean;
    students: TeacherStudentSummary[];
};

type JoinBatchData = {
    batchName: string;
};

type StudentPerformanceProfile = {
    level: number;
    totalXP: number;
    streak: number;
    totalAttempts: number;
    totalCorrect: number;
    avgAccuracy: number;
};

type StudentPerformanceAttempt = {
    id: string;
    title: string;
    category: string;
    score: number;
    totalMarks: number;
    accuracy: number;
    date: string;
};

type StudentPerformanceSummaryData = {
    student: {
        fullName: string | null;
        email: string | null;
        examTarget: string | null;
        createdAt: Date;
    };
    profile: StudentPerformanceProfile | null;
    recentAttempts: StudentPerformanceAttempt[];
    subjectAccuracy: {
        subject: string;
        accuracy: number;
    }[];
};

type StudentFeedItem = {
    id: string;
    content: string;
    createdAt: Date;
    batchName: string;
    teacherName: string;
};

type StudentFeedBatch = {
    id: string;
    name: string;
    teacherName: string;
};

type StudentFeedData = {
    feedItems: StudentFeedItem[];
    myBatches: StudentFeedBatch[];
    isAdminView: boolean;
};

export type MyEducator = {
    id: string;
    name: string;
    subjects: string[];
};

export async function getOrCreateMockTeacherB() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

/**
 * Creates a new training batch.
 */
export async function createBatch(formData: FormData): Promise<ActionResponse<BatchRecord>> {
    try {
        const name = String(formData.get("name") ?? "").trim();
        if (!name) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "create");

        const ownerId = await resolveManagedEducatorId(
            teacher,
            String(formData.get("teacherId") ?? "").trim() || null,
        );

        const batch = await createManagedBatch({
            name,
            teacherId: ownerId,
        });

        revalidateBatchSurfaces();
        return { success: true, data: batch, message: "Batch created successfully." };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Failed to create batch.") };
    }
}

/**
 * Fetches batches owned by or accessible to the current teacher.
 */
export async function getTeacherBatches(): Promise<ActionResponse<TeacherBatchesData>> {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "read");

        const isAdminView = isAdminUser(teacher);
        const batches = await prisma.batch.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            include: {
                teacher: {
                    select: { id: true, fullName: true, email: true },
                },
                enrollments: {
                    include: {
                        student: {
                            select: { id: true, fullName: true, email: true, registrationNumber: true },
                        },
                    },
                    orderBy: { joinedAt: "desc" },
                },
                announcements: {
                    include: {
                        teacher: { select: { id: true, fullName: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                _count: { select: { enrollments: true, announcements: true } },
            },
            orderBy: [{ createdAt: "desc" }],
        });

        return {
            success: true,
            data: {
                batches,
                isAdminView,
                availableTeachers: isAdminView ? await listManagedEducatorOptions() : [],
            }
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch batches." };
    }
}

/**
 * Posts an announcement to one or more batches.
 */
export async function postAnnouncement(formData: FormData): Promise<ActionResponse<PostAnnouncementData>> {
    try {
        const content = String(formData.get("content") ?? "").trim();
        const sendToAll = formData.get("sendToAll") === "true";
        const selectedBatchIds = Array.from(new Set(
            formData.getAll("batchIds").map((value) => String(value).trim()).filter(Boolean),
        ));
        if (!content) throw new Error("Update content is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_UPDATES", "share");

        const isAdminView = isAdminUser(teacher);
        const visibleBatches = await prisma.batch.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            select: { id: true, name: true },
        });

        const targetBatchIds = sendToAll
            ? visibleBatches.map((batch) => batch.id)
            : selectedBatchIds;

        if (targetBatchIds.length === 0) {
            throw new Error("Select at least one batch or choose general update.");
        }

        const visibleBatchIds = new Set(visibleBatches.map((batch) => batch.id));
        if (targetBatchIds.some((batchId) => !visibleBatchIds.has(batchId))) {
            throw new Error(
                isAdminView
                    ? "One or more selected batches are unavailable."
                    : "One or more selected batches do not belong to this teacher.",
            );
        }

        const announcements = await createBatchAnnouncements({
            authorId: teacher.id,
            content,
            batchIds: targetBatchIds,
        });

        // Feature: Push Notification
        try {
            const enrollments = await prisma.enrollment.findMany({
                where: { batchId: { in: targetBatchIds } },
                select: { studentId: true, batch: { select: { name: true } } }
            });
            
            if (enrollments.length > 0) {
                await prisma.notification.createMany({
                    data: enrollments.map(e => ({
                        userId: e.studentId,
                        title: `New Update: ${e.batch.name}`,
                        message: content.length > 60 ? content.substring(0, 57) + "..." : content,
                        type: "UPDATE",
                        link: "/student/updates"
                    }))
                });
            }
        } catch(e) { console.error("Notification creation failed", e) }

        revalidateBatchSurfaces();
        return {
            success: true,
            data: {
                announcements,
                postedCount: announcements.length,
            },
            message: `Update posted to ${announcements.length} batches.`,
        };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Failed to post.") };
    }
}

/**
 * Updates an existng batch's metadata.
 */
export async function updateBatch(formData: FormData): Promise<ActionResponse<BatchRecord>> {
    try {
        const batchId = String(formData.get("batchId") ?? "").trim();
        const name = String(formData.get("name") ?? "").trim();
        if (!batchId || !name) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "update");

        const existingBatch = await ensureScopedBatchRecord(teacher, batchId);

        const nextTeacherId = isAdminUser(teacher)
            ? await resolveManagedEducatorId(
                teacher,
                String(formData.get("teacherId") ?? "").trim() || existingBatch.teacherId,
            )
            : existingBatch.teacherId;

        const batch = await updateManagedBatchById({
            batchId,
            name,
            teacherId: nextTeacherId,
        });

        revalidateBatchSurfaces();
        return { success: true, data: batch, message: "Batch updated." };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to update batch." };
    }
}

/**
 * Deletes a batch.
 */
export async function deleteBatch(formData: FormData): Promise<ActionResponse<void>> {
    try {
        const batchId = String(formData.get("batchId") ?? "").trim();
        if (!batchId) throw new Error("Batch id is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "delete");

        const existingBatch = await ensureScopedBatchRecord(teacher, batchId);
        if (existingBatch._count.exams > 0) {
            throw new Error("Remove or reassign linked exams before deleting this batch.");
        }

        await prisma.batch.delete({
            where: { id: batchId },
        });

        revalidateBatchSurfaces();
        return { success: true, message: "Batch deleted.", data: undefined };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Failed to delete batch.") };
    }
}

/**
 * Fetches all updates and available batches for the training feed.
 */
export async function getTeacherUpdates(): Promise<ActionResponse<TeacherUpdatesData>> {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_UPDATES", "read");

        const isAdminView = isAdminUser(teacher);
        const batches = await prisma.batch.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                teacher: { select: { id: true, fullName: true, email: true } },
                _count: { select: { enrollments: true } },
            },
            orderBy: [{ name: "asc" }],
        });

        const announcements = await prisma.announcement.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            include: {
                teacher: { select: { id: true, fullName: true, email: true } },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        teacher: { select: { id: true, fullName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return { success: true, data: { batches, announcements, isAdminView } };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load updates." };
    }
}

/**
 * Fetches students across all batches owned by the current teacher.
 */
export async function getTeacherStudents(): Promise<ActionResponse<TeacherStudentsData>> {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_STUDENTS", "read");

        const isAdminView = isAdminUser(teacher);
        const enrollments = await prisma.enrollment.findMany({
            where: isAdminView
                ? undefined
                : {
                    batch: {
                        teacherId: teacher.id,
                    },
                },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        registrationNumber: true,
                        department: true,
                        createdAt: true,
                    },
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        uniqueJoinCode: true,
                        teacher: {
                            select: {
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: { joinedAt: "desc" },
        });

        const studentsMap = new Map<string, TeacherStudentSummary>();

        for (const enrollment of enrollments) {
            const studentId = enrollment.student.id;
            const ownerLabel = enrollment.batch.teacher.fullName ?? enrollment.batch.teacher.email ?? "Educator";
            const existing = studentsMap.get(studentId);

            if (!existing) {
                studentsMap.set(studentId, {
                    id: studentId,
                    name: enrollment.student.fullName ?? "Unnamed student",
                    email: enrollment.student.email ?? "No email added",
                    registrationNumber: enrollment.student.registrationNumber ?? "N/A",
                    department: enrollment.student.department ?? "General",
                    status: "Active",
                    joinedAt: enrollment.joinedAt,
                    batchNames: [enrollment.batch.name],
                    batchIds: [enrollment.batch.id],
                    batchCodes: [enrollment.batch.uniqueJoinCode],
                    batchOwners: [ownerLabel],
                    attemptDue: "--",
                });
                continue;
            }

            existing.batchNames.push(enrollment.batch.name);
            existing.batchIds.push(enrollment.batch.id);
            existing.batchCodes.push(enrollment.batch.uniqueJoinCode);
            existing.batchOwners.push(ownerLabel);
            if (new Date(enrollment.joinedAt).getTime() > new Date(existing.joinedAt).getTime()) {
                existing.joinedAt = enrollment.joinedAt;
            }
        }

        return {
            success: true,
            data: {
                isAdminView,
                students: Array.from(studentsMap.values()),
            }
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load students." };
    }
}

export async function getOrCreateMockStudentB() {
    return getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
}

/**
 * Joins a student to a batch using a join code.
 */
export async function joinBatch(formData: FormData): Promise<ActionResponse<JoinBatchData>> {
    try {
        const code = normalizeJoinCode(String(formData.get("code") ?? ""));
        if (!code) throw new Error("Please enter a join code.");

        const student = await getOrCreateMockStudentB();
        await assertUserCanAccessFeature(student.id, "STUDENT_UPDATES", "create");

        if (isAdminUser(student)) {
            throw new Error("Admin cannot join batches from the student feed. Use batch mapping in admin controls.");
        }

        const batch = await joinStudentToBatchByCode(student.id, code);

        // SYNC: Update the student's primary batch field in their profile
        const updatedStudent = await prisma.user.update({
            where: { id: student.id },
            data: { batch: code }
        });

        // Trigger session sync and UI refresh for profile-dependent components (Sidebar, Profile page)
        await syncCurrentAuthSession(updatedStudent);
        revalidateProfileSurfaces("STUDENT");
        revalidateBatchSurfaces();

        return { success: true, data: { batchName: batch.name }, message: `You've joined ${batch.name}!` };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Failed to join batch.") };
    }
}

/**
 * Removes a student from a specific batch.
 */
export async function removeStudentFromBatch(studentId: string, batchId: string): Promise<ActionResponse<JoinBatchData>> {
    try {
        const normalizedStudentId = studentId.trim();
        const normalizedBatchId = batchId.trim();
        if (!normalizedStudentId || !normalizedBatchId) {
            throw new Error("Student and batch are required.");
        }

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_STUDENTS", "delete");

        const batch = await ensureScopedBatchRecord(
            teacher,
            normalizedBatchId,
            "Batch not found or you do not own it.",
        );

        await deleteStudentEnrollment(normalizedStudentId, normalizedBatchId);

        revalidateBatchSurfaces();
        return { success: true, data: { batchName: batch.name }, message: "Student removed from batch." };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Failed to remove student.") };
    }
}

/**
 * Fetches a detailed performance summary for a student.
 */
export async function getStudentPerformanceSummary(studentId: string): Promise<ActionResponse<StudentPerformanceSummaryData>> {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_STUDENTS", "read");

        if (!isAdminUser(teacher)) {
            const enrollment = await prisma.enrollment.findFirst({
                where: { studentId, batch: { teacherId: teacher.id } },
            });
            if (!enrollment) throw new Error("Student not found in your batches.");
        }

        const [learningProfile, attempts, topicProgress, student] = await Promise.all([
            prisma.studentLearningProfile.findUnique({ where: { studentId } }),
            prisma.examAttempt.findMany({
                where: { studentId, status: "SUBMITTED" },
                include: { exam: { select: { title: true, category: true, totalMarks: true } } },
                orderBy: { startTime: "desc" },
                take: 10,
            }),
            prisma.topicProgress.findMany({
                where: { studentId },
                select: { subject: true, accuracy: true, totalAttempted: true },
            }),
            prisma.user.findUnique({
                where: { id: studentId },
                select: { fullName: true, email: true, examTarget: true, createdAt: true },
            }),
        ]);

        const subjectMap = new Map<string, { totalCorrect: number; totalQ: number }>();
        for (const tp of topicProgress) {
            const existing = subjectMap.get(tp.subject) ?? { totalCorrect: 0, totalQ: 0 };
            subjectMap.set(tp.subject, {
                totalCorrect: existing.totalCorrect + tp.accuracy * tp.totalAttempted,
                totalQ: existing.totalQ + tp.totalAttempted,
            });
        }
        const subjectAccuracy = Array.from(subjectMap.entries()).map(([subject, d]) => ({
            subject,
            accuracy: Math.round((d.totalCorrect / Math.max(d.totalQ, 1)) * 100),
        })).sort((a, b) => b.accuracy - a.accuracy);

        return {
            success: true,
            data: {
                student: student ?? { fullName: null, email: null, examTarget: null, createdAt: new Date() },
                profile: learningProfile ? {
                    level: learningProfile.level,
                    totalXP: learningProfile.totalXP,
                    streak: learningProfile.streak,
                    totalAttempts: learningProfile.totalAttempts,
                    totalCorrect: learningProfile.totalCorrect,
                    avgAccuracy: Math.round(learningProfile.avgAccuracy * 100),
                } : null,
                recentAttempts: attempts.map((a) => ({
                    id: a.id,
                    title: a.exam.title,
                    category: a.exam.category,
                    score: Math.round(a.score),
                    totalMarks: a.exam.totalMarks,
                    accuracy: a.exam.totalMarks > 0 ? Math.round((a.score / a.exam.totalMarks) * 100) : 0,
                    date: a.startTime.toISOString().split("T")[0],
                })),
                subjectAccuracy,
            }
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch performance." };
    }
}

/**
 * Fetches the training feed for a student.
 */
export async function getStudentFeed(): Promise<ActionResponse<StudentFeedData>> {
    try {
        const student = await getOrCreateMockStudentB();
        await assertUserCanAccessFeature(student.id, "STUDENT_UPDATES", "read");

        const isAdminView = isAdminUser(student);
        
        // Find teachers linked via Access Codes
        const accessCodes = await prisma.studentAccessCode.findMany({
            where: { studentId: student.id, status: "VERIFIED" },
            select: { teacherId: true }
        });
        const linkedTeacherIds = accessCodes.map((a: any) => a.teacherId);

        const batches = await prisma.batch.findMany({
            where: isAdminView
                ? undefined
                : { 
                    OR: [
                        { enrollments: { some: { studentId: student.id } } },
                        { teacherId: { in: linkedTeacherIds } }
                    ]
                },
            include: {
                teacher: { select: { id: true, fullName: true, email: true } },
                announcements: {
                    include: {
                        teacher: { select: { id: true, fullName: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: [{ name: "asc" }],
        });

        const feedItems = batches
            .flatMap((batch) =>
                batch.announcements.map((announcement) => ({
                    id: announcement.id,
                    content: announcement.content,
                    createdAt: announcement.createdAt,
                    batchName: batch.name,
                    teacherName:
                        announcement.teacher.fullName ??
                        announcement.teacher.email ??
                        batch.teacher.fullName ??
                        batch.teacher.email ??
                        "Educator",
                })),
            )
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

        const myBatches = batches.map((batch) => ({
            id: batch.id,
            name: batch.name,
            teacherName: batch.teacher.fullName ?? batch.teacher.email ?? "Educator",
        }));

        return { success: true, data: { feedItems, myBatches, isAdminView } };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load feed." };
    }
}
/**
 * Verifies if a batch code exists.
 */
export async function verifyBatchCode(code: string): Promise<ActionResponse<{ name: string }>> {
    try {
        const normalized = normalizeJoinCode(code);
        if (!normalized) throw new Error("Batch code is required.");

        const batch = await prisma.batch.findUnique({
            where: { uniqueJoinCode: normalized },
            select: { name: true },
        });

        if (!batch) {
            return { success: false, message: "Invalid batch code." };
        }

        return { success: true, data: { name: batch.name }, message: "Batch verified." };
    } catch (error: unknown) {
        return { success: false, message: getActionErrorMessage(error, "Verification failed.") };
    }
}

/**
 * Fetches all educators (teachers) a student is explicitly linked to.
 */
export async function getMyEducators(): Promise<ActionResponse<MyEducator[]>> {
    try {
        const student = await getOrCreateMockStudentB();
        
        const [enrollments, accessCodes] = await Promise.all([
            prisma.enrollment.findMany({
                where: { studentId: student.id },
                include: { batch: { include: { teacher: true } } }
            }),
            prisma.studentAccessCode.findMany({
                where: { studentId: student.id, status: "VERIFIED" },
                include: { teacher: true }
            })
        ]);

        const educatorMap = new Map<string, MyEducator>();
        
        for (const e of enrollments) {
            const t = e.batch.teacher;
            if (!educatorMap.has(t.id)) {
                educatorMap.set(t.id, { id: t.id, name: t.fullName || t.email || "Educator", subjects: [] });
            }
        }

        for (const ac of accessCodes) {
            const t = ac.teacher;
            if (!educatorMap.has(t.id)) {
                educatorMap.set(t.id, { id: t.id, name: t.fullName || t.email || "Educator", subjects: [] });
            }
            if (ac.subject) {
                const ed = educatorMap.get(t.id)!;
                if (!ed.subjects.includes(ac.subject)) ed.subjects.push(ac.subject);
            }
        }

        return { success: true, data: Array.from(educatorMap.values()) };
    } catch (error) {
         return { success: false, message: "Failed to fetch educators" };
    }
}
