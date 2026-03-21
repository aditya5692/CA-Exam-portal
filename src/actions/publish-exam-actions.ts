"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { clampNumber, getActionErrorMessage, withSerializableTransaction } from "@/lib/server/action-utils";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/shared";

/**
 * CA Level -> Exam category string stored on the Exam model
 */
const CA_LEVEL_CATEGORY: Record<string, string> = {
    foundation: "CA Foundation",
    ipc: "CA Intermediate",
    final: "CA Final",
};

export type PublishTarget =
    | { kind: "all" }
    | { kind: "batch"; batchId: string };

export type ParsedQuestion = {
    prompt: string;
    options: string[];
    correct: number[];
    subject?: string;
    topic?: string;
    difficulty?: string;
    explanation?: string;
};

export type PublishExamInput = {
    title: string;
    caLevel: "foundation" | "ipc" | "final";
    subject: string;
    chapter?: string;
    durationMinutes: number;
    examType?: string;
    target: PublishTarget;
    questions: ParsedQuestion[];
};

export type PublishExamResultData = {
    examId: string;
    examTitle: string;
    targetLabel: string;
    questionCount: number;
};

/**
 * Publishes an exam from a list of parsed questions.
 */
export async function publishExamFromQuestions(
    input: PublishExamInput
): Promise<ActionResponse<PublishExamResultData>> {
    try {
        const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
        const normalizedTitle = input.title.trim();
        const normalizedSubject = input.subject.trim();
        const normalizedChapter = input.chapter?.trim() || null;
        const normalizedExamType = input.examType?.trim() || "GENERAL";
        const normalizedDuration = clampNumber(
            Math.round(Number(input.durationMinutes) || 0),
            1,
            24 * 60,
        );
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

        if (!normalizedTitle) {
            return { success: false, message: "Exam title is required." };
        }

        if (!normalizedSubject) {
            return { success: false, message: "Subject is required." };
        }

        if (normalizedQuestions.length === 0) {
            return { success: false, message: "No questions to publish." };
        }

        for (const question of normalizedQuestions) {
            if (!question.prompt) {
                return { success: false, message: "Each question must include a prompt." };
            }

            if (question.options.length < 2) {
                return { success: false, message: "Each question must include at least two options." };
            }

            if (
                question.correct.length === 0 ||
                question.correct.some((index) => index >= question.options.length)
            ) {
                return {
                    success: false,
                    message: "Each question must include at least one valid correct answer.",
                };
            }
        }

        const category = CA_LEVEL_CATEGORY[input.caLevel] ?? "CA Final";
        const totalMarks = normalizedQuestions.length;
        const publishedExam = await withSerializableTransaction(async (tx) => {
            let resolvedBatchId: string | null = null;
            let targetLabel = "All Students";

            if (input.target.kind === "batch") {
                const batch = await tx.batch.findFirst({
                    where: {
                        id: input.target.batchId,
                        ...(teacher.role !== "ADMIN" ? { teacherId: teacher.id } : {}),
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
                    title: normalizedTitle,
                    description: `${normalizedSubject} - ${category} - Bulk uploaded MCQ series`,
                    duration: normalizedDuration,
                    totalMarks,
                    passingMarks: Math.ceil(totalMarks * 0.4),
                    category,
                    subject: normalizedSubject,
                    chapter: normalizedChapter,
                    status: "PUBLISHED",
                    examType: normalizedExamType,
                    teacherId: teacher.id,
                    batchId: resolvedBatchId,
                },
            });

            for (let index = 0; index < normalizedQuestions.length; index += 1) {
                const question = normalizedQuestions[index];
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
            };
        });

        revalidatePath("/teacher/test-series");
        revalidatePath("/student/exams");

        return {
            success: true,
            message: "Exam published successfully.",
            data: {
                examId: publishedExam.examId,
                examTitle: publishedExam.examTitle,
                targetLabel: publishedExam.targetLabel,
                questionCount: normalizedQuestions.length,
            },
        };
    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to publish exam."),
        };
    }
}

export type BatchOption = { id: string; name: string; studentCount: number };

/**
 * Fetches batches available for publishing for the current teacher.
 */
export async function getTeacherBatchOptions(): Promise<ActionResponse<BatchOption[]>> {
    try {
        const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);

        const batches = await prisma.batch.findMany({
            where: teacher.role === "ADMIN" ? undefined : { teacherId: teacher.id },
            select: {
                id: true,
                name: true,
                _count: { select: { enrollments: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            data: batches.map((batch) => ({
                id: batch.id,
                name: batch.name,
                studentCount: batch._count.enrollments,
            })),
        };
    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to fetch batches."),
        };
    }
}

export type StudentVisibleExam = {
    id: string;
    title: string;
    duration: number;
    totalMarks: number;
    category: string;
    subject: string | null;
    chapter: string | null;
    batchName: string | null;
    teacherName: string;
    questionCount: number;
    attemptCount: number;
    examType: string;
    attempt: { id: string; examId: string; status: string; score: number } | null;
};

/**
 * Fetches all exams visible to the current student based on their CA level and batch enrollments.
 */
export async function getStudentVisibleExams(
    caLevel: "foundation" | "ipc" | "final"
): Promise<ActionResponse<StudentVisibleExam[]>> {
    try {
        const student = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);
        const category = CA_LEVEL_CATEGORY[caLevel];

        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: student.id },
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
                studentId: student.id,
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

        return {
            success: true,
            data: exams.map((exam) => ({
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
            })),
        };
    } catch (err) {
        console.error("getStudentVisibleExams error:", err);
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to fetch exams."),
        };
    }
}
