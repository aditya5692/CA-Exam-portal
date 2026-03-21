import "server-only";

import prisma from "@/lib/prisma/client";
import { Prisma } from "@prisma/client";
import { createAvailableBatchJoinCode,normalizeJoinCode } from "./batch-utils";
import { type ManagedActor,isAdminUser } from "./educator-management";

export type ManagedBatchRecord = Prisma.BatchGetPayload<{
    select: {
        id: true;
        name: true;
        teacherId: true;
        uniqueJoinCode: true;
        _count: {
            select: {
                exams: true;
            };
        };
    };
}>;

export async function ensureBatchRecord(
    batchId: string,
    notFoundMessage = "Batch not found.",
) {
    const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        select: {
            id: true,
            name: true,
            teacherId: true,
            uniqueJoinCode: true,
            _count: {
                select: {
                    exams: true,
                },
            },
        },
    });

    if (!batch) {
        throw new Error(notFoundMessage);
    }

    return batch;
}

export async function ensureScopedBatchRecord(
    actor: ManagedActor,
    batchId: string,
    notFoundMessage = "Batch not found.",
) {
    const batch = await prisma.batch.findFirst({
        where: isAdminUser(actor)
            ? { id: batchId }
            : { id: batchId, teacherId: actor.id },
        select: {
            id: true,
            name: true,
            teacherId: true,
            uniqueJoinCode: true,
            _count: {
                select: {
                    exams: true,
                },
            },
        },
    });

    if (!batch) {
        throw new Error(notFoundMessage);
    }

    return batch;
}

type CreateManagedBatchInput = {
    name: string;
    teacherId: string;
    uniqueJoinCodeInput?: string | null;
};

export async function createManagedBatch(input: CreateManagedBatchInput) {
    const providedJoinCode = normalizeJoinCode(input.uniqueJoinCodeInput ?? "");
    const uniqueJoinCode = providedJoinCode || await createAvailableBatchJoinCode(input.name);

    if (providedJoinCode) {
        const existingBatch = await prisma.batch.findUnique({
            where: { uniqueJoinCode },
            select: { id: true },
        });

        if (existingBatch) {
            throw new Error("Another batch already uses this join code.");
        }
    }

    return prisma.batch.create({
        data: {
            name: input.name,
            teacherId: input.teacherId,
            uniqueJoinCode,
        },
    });
}

type UpdateManagedBatchInput = {
    batchId: string;
    name: string;
    teacherId: string;
    uniqueJoinCode?: string | null;
};

export async function updateManagedBatchById(input: UpdateManagedBatchInput) {
    const normalizedJoinCode =
        input.uniqueJoinCode === undefined
            ? undefined
            : normalizeJoinCode(input.uniqueJoinCode ?? "");

    if (normalizedJoinCode) {
        const duplicateBatch = await prisma.batch.findFirst({
            where: {
                uniqueJoinCode: normalizedJoinCode,
                id: { not: input.batchId },
            },
            select: { id: true },
        });

        if (duplicateBatch) {
            throw new Error("Another batch already uses this join code.");
        }
    }

    return prisma.batch.update({
        where: { id: input.batchId },
        data: {
            name: input.name,
            teacherId: input.teacherId,
            ...(normalizedJoinCode !== undefined ? { uniqueJoinCode: normalizedJoinCode } : {}),
        },
    });
}

export async function ensureStudentUserRecord(
    studentId: string,
    notFoundMessage = "Selected user is not a student.",
) {
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { id: true, role: true },
    });

    if (!student || student.role !== "STUDENT") {
        throw new Error(notFoundMessage);
    }

    return student;
}

export async function upsertBatchEnrollment(studentId: string, batchId: string) {
    await ensureStudentUserRecord(studentId);
    await ensureBatchRecord(batchId);

    return prisma.enrollment.upsert({
        where: { studentId_batchId: { studentId, batchId } },
        update: {},
        create: { studentId, batchId },
    });
}

export async function deleteEnrollmentById(
    enrollmentId: string,
    notFoundMessage = "Enrollment not found.",
) {
    const deletedEnrollment = await prisma.enrollment.deleteMany({
        where: { id: enrollmentId },
    });

    if (deletedEnrollment.count === 0) {
        throw new Error(notFoundMessage);
    }
}

export async function deleteStudentEnrollment(
    studentId: string,
    batchId: string,
    notFoundMessage = "Student is not enrolled in this batch.",
) {
    const deletedEnrollment = await prisma.enrollment.deleteMany({
        where: { studentId, batchId },
    });

    if (deletedEnrollment.count === 0) {
        throw new Error(notFoundMessage);
    }
}

export async function ensureAnnouncementAuthorRecord(
    authorId: string,
    notFoundMessage = "Announcement author not found.",
) {
    const author = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true, role: true },
    });

    if (!author) {
        throw new Error(notFoundMessage);
    }

    if (!["TEACHER", "ADMIN"].includes(author.role)) {
        throw new Error("Author must be a teacher or admin.");
    }

    return author;
}

type CreateBatchAnnouncementsInput = {
    authorId: string;
    content: string;
    batchIds: string[];
};

export async function createBatchAnnouncements(input: CreateBatchAnnouncementsInput) {
    const uniqueBatchIds = Array.from(new Set(input.batchIds.filter(Boolean)));
    if (uniqueBatchIds.length === 0) {
        throw new Error("Select at least one batch or choose general update.");
    }

    const validBatches = await prisma.batch.findMany({
        where: { id: { in: uniqueBatchIds } },
        select: { id: true },
    });

    if (validBatches.length !== uniqueBatchIds.length) {
        throw new Error("One or more selected batches are unavailable.");
    }

    return prisma.$transaction(
        uniqueBatchIds.map((batchId) =>
            prisma.announcement.create({
                data: {
                    batchId,
                    content: input.content,
                    teacherId: input.authorId,
                },
            }),
        ),
    );
}

export async function findBatchByJoinCode(joinCode: string) {
    const batch = await prisma.batch.findUnique({
        where: { uniqueJoinCode: joinCode },
    });

    if (!batch) {
        throw new Error(`No batch found with code "${joinCode}". Please check and try again.`);
    }

    return batch;
}

export async function joinStudentToBatchByCode(studentId: string, joinCode: string) {
    const batch = await findBatchByJoinCode(joinCode);

    const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
            studentId_batchId: {
                studentId,
                batchId: batch.id,
            },
        },
    });

    if (existingEnrollment) {
        throw new Error(`You are already enrolled in "${batch.name}".`);
    }

    await prisma.enrollment.create({
        data: {
            studentId,
            batchId: batch.id,
        },
    });

    return batch;
}
