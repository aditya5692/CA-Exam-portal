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

export async function getOrCreateMockTeacherB() {
    return getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
}

export async function createBatch(formData: FormData) {
    try {
        const name = formData.get("name") as string;
        if (!name?.trim()) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "create");
        const uniqueJoinCode = generateJoinCode(name);

        const batch = await prisma.batch.create({
            data: { name, uniqueJoinCode, teacherId: teacher.id }
        });

        revalidatePath("/teacher/batches");
        return { success: true, batch };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to create batch." };
    }
}

export async function getTeacherBatches() {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "read");

        const batches = await prisma.batch.findMany({
            where: { teacherId: teacher.id },
            include: {
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                registrationNumber: true,
                            }
                        }
                    },
                    orderBy: { joinedAt: "desc" }
                },
                announcements: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
                _count: { select: { enrollments: true, announcements: true } },
            },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, batches };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to fetch batches." };
    }
}

export async function postAnnouncement(formData: FormData) {
    try {
        const content = formData.get("content") as string;
        const sendToAll = formData.get("sendToAll") === "true";
        const selectedBatchIds = formData.getAll("batchIds").map((value) => String(value));
        if (!content?.trim()) throw new Error("Update content is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_UPDATES", "share");

        const teacherBatches = await prisma.batch.findMany({
            where: { teacherId: teacher.id },
            select: { id: true, name: true }
        });

        const targetBatchIds = sendToAll
            ? teacherBatches.map((batch) => batch.id)
            : selectedBatchIds;

        if (targetBatchIds.length === 0) {
            throw new Error("Select at least one batch or choose general update.");
        }

        const teacherBatchIds = new Set(teacherBatches.map((batch) => batch.id));
        if (targetBatchIds.some((batchId) => !teacherBatchIds.has(batchId))) {
            throw new Error("One or more selected batches do not belong to this teacher.");
        }

        const announcements = await prisma.$transaction(
            targetBatchIds.map((batchId) =>
                prisma.announcement.create({
                    data: { batchId, content, teacherId: teacher.id }
                })
            )
        );

        revalidatePath("/teacher/updates");
        revalidatePath("/teacher/batches");
        revalidatePath("/student/updates");
        return { success: true, announcements, postedCount: announcements.length };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to post." };
    }
}

export async function updateBatch(formData: FormData) {
    try {
        const batchId = String(formData.get("batchId") ?? "");
        const name = String(formData.get("name") ?? "").trim();
        if (!batchId || !name) throw new Error("Batch name is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "update");

        const existingBatch = await prisma.batch.findFirst({
            where: { id: batchId, teacherId: teacher.id },
            select: { id: true }
        });
        if (!existingBatch) throw new Error("Batch not found.");

        const batch = await prisma.batch.update({
            where: { id: batchId },
            data: { name }
        });

        revalidatePath("/teacher/batches");
        revalidatePath("/teacher/updates");
        return { success: true, batch };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to update batch." };
    }
}

export async function deleteBatch(formData: FormData) {
    try {
        const batchId = String(formData.get("batchId") ?? "");
        if (!batchId) throw new Error("Batch id is required.");

        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_BATCHES", "delete");

        const existingBatch = await prisma.batch.findFirst({
            where: { id: batchId, teacherId: teacher.id },
            select: { id: true }
        });
        if (!existingBatch) throw new Error("Batch not found.");

        await prisma.batch.delete({
            where: { id: batchId },
        });

        revalidatePath("/teacher/batches");
        revalidatePath("/teacher/updates");
        revalidatePath("/student/updates");
        return { success: true };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to delete batch." };
    }
}

export async function getTeacherUpdates() {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_UPDATES", "read");

        const batches = await prisma.batch.findMany({
            where: { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                _count: {
                    select: { enrollments: true }
                }
            },
            orderBy: { name: "asc" }
        });

        const announcements = await prisma.announcement.findMany({
            where: { teacherId: teacher.id },
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return { success: true, batches, announcements };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load updates." };
    }
}

export async function getTeacherStudents() {
    try {
        const teacher = await getOrCreateMockTeacherB();
        await assertUserCanAccessFeature(teacher.id, "TEACHER_STUDENTS", "read");

        const enrollments = await prisma.enrollment.findMany({
            where: {
                batch: {
                    teacherId: teacher.id,
                }
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
                    }
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        uniqueJoinCode: true,
                    }
                }
            },
            orderBy: { joinedAt: "desc" }
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
            attemptDue: string;
        }>();

        for (const enrollment of enrollments) {
            const studentId = enrollment.student.id;
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
                    attemptDue: "--",
                });
                continue;
            }

            existing.batchNames.push(enrollment.batch.name);
            existing.batchCodes.push(enrollment.batch.uniqueJoinCode);
            if (new Date(enrollment.joinedAt).getTime() > new Date(existing.joinedAt).getTime()) {
                existing.joinedAt = enrollment.joinedAt;
            }
        }

        return {
            success: true,
            students: Array.from(studentsMap.values()).map((student) => ({
                ...student,
                batchNames: Array.from(new Set(student.batchNames)),
                batchCodes: Array.from(new Set(student.batchCodes)),
            })),
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
        const code = (formData.get("code") as string)?.trim().toUpperCase();
        if (!code) throw new Error("Please enter a join code.");

        const batch = await prisma.batch.findUnique({ where: { uniqueJoinCode: code } });
        if (!batch) throw new Error(`No batch found with code "${code}". Please check and try again.`);

        const student = await getOrCreateMockStudentB();
        await assertUserCanAccessFeature(student.id, "STUDENT_UPDATES", "create");

        const existing = await prisma.enrollment.findUnique({
            where: { studentId_batchId: { studentId: student.id, batchId: batch.id } }
        });
        if (existing) throw new Error(`You are already enrolled in "${batch.name}".`);

        await prisma.enrollment.create({
            data: { studentId: student.id, batchId: batch.id }
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

        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: student.id },
            include: {
                batch: {
                    include: {
                        teacher: { select: { fullName: true } },
                        announcements: { orderBy: { createdAt: "desc" } }
                    }
                }
            }
        });

        const feedItems = enrollments.flatMap((enrollment) =>
            enrollment.batch.announcements.map((announcement) => ({
                id: announcement.id,
                content: announcement.content,
                createdAt: announcement.createdAt,
                batchName: enrollment.batch.name,
                teacherName: enrollment.batch.teacher.fullName ?? "Educator",
            }))
        ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const myBatches = enrollments.map((enrollment) => ({
            id: enrollment.batch.id,
            name: enrollment.batch.name,
            teacherName: enrollment.batch.teacher.fullName ?? "Educator",
        }));

        return { success: true, feedItems, myBatches };
    } catch (error: unknown) {
        return { success: false, message: error instanceof Error ? error.message : "Failed to load feed." };
    }
}
