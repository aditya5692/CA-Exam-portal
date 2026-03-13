"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

/**
 * CA Level → Exam category string stored on the Exam model
 */
const CA_LEVEL_CATEGORY: Record<string, string> = {
    foundation: "CA Foundation",
    ipc: "CA Intermediate (IPC)",
    final: "CA Final",
};

// ── Types ──────────────────────────────────────────────────────────────────────

export type PublishTarget =
    | { kind: "all" }                        // all students of the chosen category
    | { kind: "batch"; batchId: string };    // students in one specific batch

export type ParsedQuestion = {
    prompt: string;
    options: string[];       // [A, B, C, D]
    correct: number[];       // 0-indexed array
    subject?: string;
    topic?: string;
    difficulty?: string;
    explanation?: string;
};

export type PublishExamInput = {
    title: string;
    caLevel: "foundation" | "ipc" | "final";
    subject: string;
    durationMinutes: number;
    target: PublishTarget;
    questions: ParsedQuestion[];
};

export type PublishExamResult =
    | { success: true; examId: string; examTitle: string; targetLabel: string; questionCount: number }
    | { success: false; error: string };

// ── Server action ──────────────────────────────────────────────────────────────

export async function publishExamFromQuestions(
    input: PublishExamInput
): Promise<PublishExamResult> {
    try {
        const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);

        if (input.questions.length === 0) {
            return { success: false, error: "No questions to publish." };
        }

        // ── Validate batch ownership if target is batch-specific ────────────
        let resolvedBatchId: string | null = null;
        let targetLabel = "All Students";

        if (input.target.kind === "batch") {
            const batch = await prisma.batch.findFirst({
                where: {
                    id: input.target.batchId,
                    // Admin can publish to any batch; teacher only to their own
                    ...(teacher.role !== "ADMIN" ? { teacherId: teacher.id } : {}),
                },
                select: { id: true, name: true },
            });

            if (!batch) {
                return {
                    success: false,
                    error: "The selected batch was not found or you do not own it.",
                };
            }

            resolvedBatchId = batch.id;
            targetLabel = `Batch: ${batch.name}`;
        }

        const category = CA_LEVEL_CATEGORY[input.caLevel] ?? "CA Final";
        const totalMarks = input.questions.length; // 1 mark per question

        // ── Create the Exam record ──────────────────────────────────────────
        const exam = await prisma.exam.create({
            data: {
                title: input.title,
                description: `${input.subject} · ${category} · Bulk uploaded MCQ series`,
                duration: input.durationMinutes,
                totalMarks,
                passingMarks: Math.ceil(totalMarks * 0.4),
                category,
                status: "PUBLISHED",
                teacherId: teacher.id,
                batchId: resolvedBatchId, // null = visible to all students of this category
            },
        });

        // ── Create Question + Option + ExamQuestion records in a transaction ─
        await prisma.$transaction(async (tx) => {
            for (let i = 0; i < input.questions.length; i++) {
                const q = input.questions[i];

                // Create a reusable Question record
                const question = await tx.question.create({
                    data: {
                        text: q.prompt,
                        subject: q.subject ?? input.subject,
                        topic: q.topic ?? null,
                        difficulty: q.difficulty ?? "MEDIUM",
                        explanation: q.explanation ?? null,
                        options: {
                            create: q.options.map((opt, idx) => ({
                                text: opt,
                                isCorrect: q.correct.includes(idx),
                            })),
                        },
                    },
                });

                // Link it to the exam with ordering
                await tx.examQuestion.create({
                    data: {
                        examId: exam.id,
                        questionId: question.id,
                        order: i + 1,
                        marks: 1,
                    },
                });
            }
        });

        revalidatePath("/teacher/test-series");
        revalidatePath("/student/exams");

        return {
            success: true,
            examId: exam.id,
            examTitle: exam.title,
            targetLabel,
            questionCount: input.questions.length,
        };
    } catch (err) {
        console.error("publishExamFromQuestions error:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "Failed to publish exam.",
        };
    }
}

// ── Fetch teacher's batches for the publish picker ────────────────────────────

export type BatchOption = { id: string; name: string; studentCount: number };

export async function getTeacherBatchOptions(): Promise<{
    success: boolean;
    batches: BatchOption[];
    error?: string;
}> {
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
            batches: batches.map((b) => ({
                id: b.id,
                name: b.name,
                studentCount: b._count.enrollments,
            })),
        };
    } catch (err) {
        return {
            success: false,
            batches: [],
            error: err instanceof Error ? err.message : "Failed to fetch batches.",
        };
    }
}

// ── Fetch real exams visible to a student ─────────────────────────────────────
// Called by /student/exams page once wired to real auth.

export async function getStudentVisibleExams(caLevel: "foundation" | "ipc" | "final") {
    try {
        const student = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);
        const category = CA_LEVEL_CATEGORY[caLevel];

        // Find all batches the student is enrolled in
        const enrollments = await prisma.enrollment.findMany({
            where: { studentId: student.id },
            select: { batchId: true },
        });
        const enrolledBatchIds = enrollments.map((e) => e.batchId);

        // Exam is visible if: same category AND (batchId is null OR batchId is one they're enrolled in)
        const exams = await prisma.exam.findMany({
            where: {
                category,
                status: "PUBLISHED",
                OR: [
                    { batchId: null },                                          // global
                    { batchId: { in: enrolledBatchIds } },                     // their batch
                ],
            },
            include: {
                teacher: { select: { fullName: true, email: true } },
                batch: { select: { name: true } },
                _count: { select: { questions: true, attempts: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Check which ones the student has already attempted
        const attempts = await prisma.examAttempt.findMany({
            where: {
                studentId: student.id,
                examId: { in: exams.map((e: any) => e.id) },
            },
            select: { examId: true, status: true, score: true },
        });

        const attemptMap = new Map(attempts.map((a: any) => [a.examId, a]));

        return {
            success: true,
            exams: exams.map((e: any) => ({
                id: e.id,
                title: e.title,
                duration: e.duration,
                totalMarks: e.totalMarks,
                category: e.category,
                batchName: e.batch?.name ?? null,
                teacherName: e.teacher.fullName ?? e.teacher.email ?? "Teacher",
                questionCount: e._count.questions,
                attemptCount: e._count.attempts,
                attempt: attemptMap.get(e.id) ?? null, // null = not yet attempted
            })),
        };
    } catch (err) {
        return {
            success: false,
            exams: [],
            error: err instanceof Error ? err.message : "Failed to fetch exams.",
        };
    }
}
