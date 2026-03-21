import "server-only";

import prisma from "@/lib/prisma/client";
import type {
  BatchOption,
  PublishExamInput,
  PublishExamResultData,
  PublishTarget,
  StudentVisibleExam,
} from "@/types/publish-exam";
import { clampNumber,withSerializableTransaction } from "./action-utils";
import { type ManagedActor,isAdminUser } from "./educator-management";
import { expireStudentStartedAttempts } from "./exam-workflow";

const CA_LEVEL_CATEGORY: Record<string, string> = {
    foundation: "CA Foundation",
    ipc: "CA Intermediate",
    final: "CA Final",
};

type NormalizedQuestion = {
    prompt: string;
    options: string[];
    correct: number[];
    subject: string;
    topic: string | null;
    difficulty: string;
    explanation: string | null;
};

type NormalizedPublishInput = {
    title: string;
    subject: string;
    chapter: string | null;
    examType: string;
    durationMinutes: number;
    category: string;
    questions: NormalizedQuestion[];
    target: PublishTarget;
};

export function normalizePublishExamInput(input: PublishExamInput): NormalizedPublishInput {
    const normalizedTitle = input.title.trim();
    const normalizedSubject = input.subject.trim();
    const normalizedChapter = input.chapter?.trim() || null;
    const normalizedExamType = input.examType?.trim() || "GENERAL";
    const normalizedDuration = clampNumber(
        Math.round(Number(input.durationMinutes) || 0),
        1,
        24 * 60,
    );

    if (!normalizedTitle) {
        throw new Error("Exam title is required.");
    }

    if (!normalizedSubject) {
        throw new Error("Subject is required.");
    }

    const normalizedQuestions = input.questions.map((question) => ({
        prompt: question.prompt.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
        correct: Array.from(new Set(
            question.correct
                .map((index) => Math.round(Number(index)))
                .filter((index) => Number.isInteger(index) && index >= 0),
        )).sort((left, right) => left - right),
        subject: question.subject?.trim() || normalizedSubject,
        topic: question.topic?.trim() || null,
        difficulty: question.difficulty?.trim() || "MEDIUM",
        explanation: question.explanation?.trim() || null,
    }));

    if (normalizedQuestions.length === 0) {
        throw new Error("No questions to publish.");
    }

    for (const question of normalizedQuestions) {
        if (!question.prompt) {
            throw new Error("Each question must include a prompt.");
        }

        if (question.options.length < 2) {
            throw new Error("Each question must include at least two options.");
        }

        if (
            question.correct.length === 0 ||
            question.correct.some((index) => index >= question.options.length)
        ) {
            throw new Error("Each question must include at least one valid correct answer.");
        }
    }

    return {
        title: normalizedTitle,
        subject: normalizedSubject,
        chapter: normalizedChapter,
        examType: normalizedExamType,
        durationMinutes: normalizedDuration,
        category: CA_LEVEL_CATEGORY[input.caLevel] ?? "CA Final",
        questions: normalizedQuestions,
        target: input.target,
    };
}

export async function publishExamQuestions(
    actor: ManagedActor,
    input: PublishExamInput,
): Promise<PublishExamResultData> {
    const normalized = normalizePublishExamInput(input);
    const totalMarks = normalized.questions.length;

    return withSerializableTransaction(async (tx) => {
        let resolvedBatchId: string | null = null;
        let targetLabel = "All Students";

        if (normalized.target.kind === "batch") {
            const batch = await tx.batch.findFirst({
                where: {
                    id: normalized.target.batchId,
                    ...(isAdminUser(actor) ? {} : { teacherId: actor.id }),
                },
                select: { id: true, name: true },
            });

            if (!batch) {
                throw new Error("The selected batch was not found or you do not own it.");
            }

            resolvedBatchId = batch.id;
            targetLabel = `Batch: ${batch.name}`;
        }

        const exam = await tx.exam.create({
            data: {
                title: normalized.title,
                description: `${normalized.subject} - ${normalized.category} - Bulk uploaded MCQ series`,
                duration: normalized.durationMinutes,
                totalMarks,
                passingMarks: Math.ceil(totalMarks * 0.4),
                category: normalized.category,
                subject: normalized.subject,
                chapter: normalized.chapter,
                status: "PUBLISHED",
                examType: normalized.examType,
                teacherId: actor.id,
                batchId: resolvedBatchId,
            },
        });

        for (let index = 0; index < normalized.questions.length; index += 1) {
            const question = normalized.questions[index];
            const createdQuestion = await tx.question.create({
                data: {
                    text: question.prompt,
                    subject: question.subject,
                    topic: question.topic,
                    difficulty: question.difficulty,
                    explanation: question.explanation,
                    options: {
                        create: question.options.map((option, optionIndex) => ({
                            text: option,
                            isCorrect: question.correct.includes(optionIndex),
                        })),
                    },
                },
            });

            await tx.examQuestion.create({
                data: {
                    examId: exam.id,
                    questionId: createdQuestion.id,
                    order: index + 1,
                    marks: 1,
                },
            });
        }

        return {
            examId: exam.id,
            examTitle: exam.title,
            targetLabel,
            questionCount: normalized.questions.length,
        };
    });
}

export async function listTeacherBatchOptions(actor: ManagedActor): Promise<BatchOption[]> {
    const batches = await prisma.batch.findMany({
        where: isAdminUser(actor) ? undefined : { teacherId: actor.id },
        select: {
            id: true,
            name: true,
            _count: { select: { enrollments: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return batches.map((batch) => ({
        id: batch.id,
        name: batch.name,
        studentCount: batch._count.enrollments,
    }));
}

export async function listStudentVisibleExams(
    studentId: string,
    caLevel: "foundation" | "ipc" | "final",
): Promise<StudentVisibleExam[]> {
    await expireStudentStartedAttempts(studentId);

    const category = CA_LEVEL_CATEGORY[caLevel];
    const enrollments = await prisma.enrollment.findMany({
        where: { studentId },
        select: { batchId: true },
    });
    const enrolledBatchIds = enrollments.map((enrollment) => enrollment.batchId);

    const exams = await prisma.exam.findMany({
        where: {
            category,
            status: "PUBLISHED",
            OR: [
                { batchId: null },
                { batchId: { in: enrolledBatchIds } },
            ],
        },
        include: {
            teacher: { select: { fullName: true, email: true } },
            batch: { select: { name: true } },
            _count: { select: { questions: true, attempts: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const attempts = await prisma.examAttempt.findMany({
        where: {
            studentId,
            examId: { in: exams.map((exam) => exam.id) },
        },
        select: { id: true, examId: true, status: true, score: true },
        orderBy: { startTime: "desc" },
    });

    const attemptMap = new Map<string, typeof attempts[number]>();
    for (const attempt of attempts) {
        if (!attemptMap.has(attempt.examId)) {
            attemptMap.set(attempt.examId, attempt);
        }
    }

    return exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        category: exam.category,
        subject: exam.subject,
        chapter: exam.chapter,
        batchName: exam.batch?.name ?? null,
        teacherName: exam.teacher.fullName ?? exam.teacher.email ?? "Teacher",
        questionCount: exam._count.questions,
        attemptCount: exam._count.attempts,
        examType: exam.examType,
        attempt: attemptMap.get(exam.id) ?? null,
    }));
}
