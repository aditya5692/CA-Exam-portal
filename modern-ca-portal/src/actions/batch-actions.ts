"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { assertUserCanAccessFeature } from "@/lib/auth/feature-access";
import prisma from "@/lib/prisma/client";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

function generateJoinCode(name: string): string {
    const slug = name.toUpperCase().replace(/\s+/g, "-").slice(0, 8);
    const rand = randomBytes(3).toString("hex").toUpperCase();
    return `${slug}-${rand}`;
}

function isAdminUser(user: { role: string }) {
    return user.role === "ADMIN";
}

function revalidateBatchSurfaces() {
    revalidatePath("/admin/dashboard");
    revalidatePath("/teacher/batches");
    revalidatePath("/teacher/students");
    revalidatePath("/teacher/updates");
    revalidatePath("/student/updates");
}

async function getEducatorOptions() {
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

async function resolveManagedEducatorId(actor: { id: string; role: string }, requestedEducatorId: string | null) {
    if (!isAdminUser(actor)) {
        return actor.id;
    }

    if (!requestedEducatorId) {
        return actor.id;
    }

    const educator = await prisma.user.findFirst({
        where: {
            id: requestedEducatorId,
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

export async function getOrCreateMockTeacherB() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

export async function createBatch(formData: FormData) {
    try {
        const name = String(formData.get("name") ?? "").trim();
        if (!name) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "create");

        const ownerId = await resolveManagedEducatorId(
            teacher,
            String(formData.get("teacherId") ?? "").trim() || null,
        );

        const batch = await prisma.batch.create({
            data: {
                name,
                uniqueJoinCode: generateJoinCode(name),
                teacherId: ownerId,
            },
        });

        revalidateBatchSurfaces();
        return { success: true, batch };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to create batch." };
    }
}

export async function getTeacherBatches() {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "read");

        const isAdminView = isAdminUser(teacher);
        const batches = await prisma.batch.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                registrationNumber: true,
                            },
                        },
                    },
                    orderBy: { joinedAt: "desc" },
                },
                announcements: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
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
            batches,
            isAdminView,
            availableTeachers: isAdminView ? await getEducatorOptions() : [],
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch batches." };
    }
}

export async function postAnnouncement(formData: FormData) {
    try {
        const content = String(formData.get("content") ?? "").trim();
        const sendToAll = formData.get("sendToAll") === "true";
        const selectedBatchIds = formData.getAll("batchIds").map((value) => String(value));
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

        const announcements = await prisma.$transaction(
            targetBatchIds.map((batchId) =>
                prisma.announcement.create({
                    data: { batchId, content, teacherId: teacher.id },
                }),
            ),
        );

        revalidateBatchSurfaces();
        return { success: true, announcements, postedCount: announcements.length };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to post." };
    }
}

export async function updateBatch(formData: FormData) {
    try {
        const batchId = String(formData.get("batchId") ?? "").trim();
        const name = String(formData.get("name") ?? "").trim();
        if (!batchId || !name) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "update");

        const isAdminView = isAdminUser(teacher);
        const existingBatch = await prisma.batch.findFirst({
            where: isAdminView ? { id: batchId } : { id: batchId, teacherId: teacher.id },
            select: { id: true, teacherId: true },
        });
        if (!existingBatch) throw new Error("Batch not found.");

        const nextTeacherId = isAdminView
            ? await resolveManagedEducatorId(
                teacher,
                String(formData.get("teacherId") ?? "").trim() || existingBatch.teacherId,
            )
            : existingBatch.teacherId;

        const batch = await prisma.batch.update({
            where: { id: batchId },
            data: {
                name,
                teacherId: nextTeacherId,
            },
        });

        revalidateBatchSurfaces();
        return { success: true, batch };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to update batch." };
    }
}

export async function deleteBatch(formData: FormData) {
    try {
        const batchId = String(formData.get("batchId") ?? "").trim();
        if (!batchId) throw new Error("Batch id is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "delete");

        const isAdminView = isAdminUser(teacher);
        const existingBatch = await prisma.batch.findFirst({
            where: isAdminView ? { id: batchId } : { id: batchId, teacherId: teacher.id },
            select: { id: true },
        });
        if (!existingBatch) throw new Error("Batch not found.");

        await prisma.batch.delete({
            where: { id: batchId },
        });

        revalidateBatchSurfaces();
        return { success: true };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to delete batch." };
    }
}

export async function getTeacherUpdates() {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_UPDATES", "read");

        const isAdminView = isAdminUser(teacher);
        const batches = await prisma.batch.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
            orderBy: [{ name: "asc" }],
        });

        const announcements = await prisma.announcement.findMany({
            where: isAdminView ? undefined : { teacherId: teacher.id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        teacher: {
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
            take: 20,
        });

        return { success: true, batches, announcements, isAdminView };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load updates." };
    }
}

export async function getTeacherStudents() {
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

        const studentsMap = new Map<string, {
            id: string;
            name: string;
            email: string;
            registrationNumber: string;
            department: string;
            status: string;
            joinedAt: Date;
            batchNames: string[];
            batchCodes: string[];
            batchOwners: string[];
            attemptDue: string;
        }>();

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
                    batchCodes: [enrollment.batch.uniqueJoinCode],
                    batchOwners: [ownerLabel],
                    attemptDue: "--",
                });
                continue;
            }

            existing.batchNames.push(enrollment.batch.name);
            existing.batchCodes.push(enrollment.batch.uniqueJoinCode);
            existing.batchOwners.push(ownerLabel);
            if (new Date(enrollment.joinedAt).getTime() > new Date(existing.joinedAt).getTime()) {
                existing.joinedAt = enrollment.joinedAt;
            }
        }

        return {
            success: true,
            isAdminView,
            students: Array.from(studentsMap.values()),
        };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load students." };
    }
}

export async function getOrCreateMockStudentB() {
    return getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
}

export async function joinBatch(formData: FormData) {
    try {
        const code = String(formData.get("code") ?? "").trim().toUpperCase();
        if (!code) throw new Error("Please enter a join code.");

        const student = await getOrCreateMockStudentB();
        await assertUserCanAccessFeature(student.id, "STUDENT_UPDATES", "create");

        if (isAdminUser(student)) {
            throw new Error("Admin cannot join batches from the student feed. Use batch mapping in admin controls.");
        }

        const batch = await prisma.batch.findUnique({ where: { uniqueJoinCode: code } });
        if (!batch) throw new Error(`No batch found with code "${code}". Please check and try again.`);

        const existing = await prisma.enrollment.findUnique({
            where: { studentId_batchId: { studentId: student.id, batchId: batch.id } },
        });
        if (existing) throw new Error(`You are already enrolled in "${batch.name}".`);

        await prisma.enrollment.create({
            data: { studentId: student.id, batchId: batch.id },
        });

        revalidatePath("/student/updates");
        return { success: true, batchName: batch.name };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to join batch." };
    }
}

export async function getStudentFeed() {
    try {
        const student = await getOrCreateMockStudentB();
        await assertUserCanAccessFeature(student.id, "STUDENT_UPDATES", "read");

        const isAdminView = isAdminUser(student);
        const batches = await prisma.batch.findMany({
            where: isAdminView
                ? undefined
                : {
                    enrollments: {
                        some: {
                            studentId: student.id,
                        },
                    },
                },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                announcements: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
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

        return { success: true, feedItems, myBatches, isAdminView };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load feed." };
    }
}

