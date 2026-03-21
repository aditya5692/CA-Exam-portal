import "server-only";

import { Prisma, type ExamAttempt } from "@prisma/client";
import { clampNumber, withSerializableTransaction } from "./action-utils";

export type SubmittedExamAnswerInput = {
    questionId: string;
    selectedOptionId: string;
    timeSpent: number;
};

type StartAttemptOptions = {
    enforceVisibility?: boolean;
};

function normalizeId(value: string) {
    return value.trim();
}

function normalizeSubmittedAnswers(answers: SubmittedExamAnswerInput[]) {
    const dedupedAnswers = new Map<string, SubmittedExamAnswerInput>();

    for (const answer of answers) {
        const questionId = normalizeId(answer.questionId);
        const selectedOptionId = normalizeId(answer.selectedOptionId);

        if (!questionId || !selectedOptionId) {
            continue;
        }

        dedupedAnswers.set(questionId, {
            questionId,
            selectedOptionId,
            timeSpent: clampNumber(Math.round(Number(answer.timeSpent) || 0), 0, 24 * 60 * 60),
        });
    }

    return Array.from(dedupedAnswers.values());
}

async function assertStudentExists(tx: Prisma.TransactionClient, studentId: string) {
    const student = await tx.user.findUnique({
        where: { id: studentId },
        select: { id: true },
    });

    if (!student) {
        throw new Error("Student not found.");
    }
}

async function assertExamCanBeStarted(
    tx: Prisma.TransactionClient,
    examId: string,
    studentId: string,
    enforceVisibility: boolean,
) {
    const exam = await tx.exam.findUnique({
        where: { id: examId },
        select: {
            id: true,
            status: true,
            batchId: true,
        },
    });

    if (!exam) {
        throw new Error("Exam not found.");
    }

    if (exam.status !== "PUBLISHED") {
        throw new Error("This exam is not available right now.");
    }

    if (enforceVisibility && exam.batchId) {
        const enrollment = await tx.enrollment.findUnique({
            where: {
                studentId_batchId: {
                    studentId,
                    batchId: exam.batchId,
                },
            },
            select: { id: true },
        });

        if (!enrollment) {
            throw new Error("This exam is not available for your batches.");
        }
    }
}

export async function startExamAttemptRecord(
    examId: string,
    studentId: string,
    options: StartAttemptOptions = {},
): Promise<ExamAttempt> {
    const normalizedExamId = normalizeId(examId);
    const normalizedStudentId = normalizeId(studentId);

    if (!normalizedExamId) {
        throw new Error("Exam id is required.");
    }

    if (!normalizedStudentId) {
        throw new Error("Student id is required.");
    }

    return withSerializableTransaction(async (tx) => {
        await assertStudentExists(tx, normalizedStudentId);
        await assertExamCanBeStarted(
            tx,
            normalizedExamId,
            normalizedStudentId,
            options.enforceVisibility ?? false,
        );

        const existingAttempt = await tx.examAttempt.findFirst({
            where: {
                examId: normalizedExamId,
                studentId: normalizedStudentId,
                status: "STARTED",
            },
            orderBy: { startTime: "desc" },
        });

        if (existingAttempt) {
            return existingAttempt;
        }

        return tx.examAttempt.create({
            data: {
                examId: normalizedExamId,
                studentId: normalizedStudentId,
                status: "STARTED",
                startTime: new Date(),
            },
        });
    });
}

export async function submitExamAttemptRecord(
    attemptId: string,
    rawAnswers: SubmittedExamAnswerInput[],
): Promise<ExamAttempt> {
    const normalizedAttemptId = normalizeId(attemptId);

    if (!normalizedAttemptId) {
        throw new Error("Attempt id is required.");
    }

    return withSerializableTransaction(async (tx) => {
        const attempt = await tx.examAttempt.findUnique({
            where: { id: normalizedAttemptId },
            include: {
                exam: {
                    include: {
                        questions: {
                            include: {
                                question: {
                                    include: {
                                        options: true,
                                    },
                                },
                            },
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!attempt) {
            throw new Error("Attempt not found.");
        }

        if (attempt.status === "SUBMITTED") {
            return tx.examAttempt.findUniqueOrThrow({
                where: { id: normalizedAttemptId },
            });
        }

        if (attempt.status !== "STARTED") {
            throw new Error("This attempt is no longer active.");
        }

        const answers = normalizeSubmittedAnswers(rawAnswers);
        const questionMap = new Map(
            attempt.exam.questions.map((examQuestion) => [examQuestion.questionId, examQuestion]),
        );

        let totalScore = 0;

        for (const answer of answers) {
            const examQuestion = questionMap.get(answer.questionId);
            if (!examQuestion) {
                continue;
            }

            const selectedOption = examQuestion.question.options.find(
                (option) => option.id === answer.selectedOptionId,
            );
            const selectedOptionId = selectedOption?.id ?? null;
            const isCorrect = selectedOption?.isCorrect ?? false;

            if (isCorrect) {
                totalScore += examQuestion.marks;
            }

            await tx.studentAnswer.upsert({
                where: {
                    attemptId_questionId: {
                        attemptId: normalizedAttemptId,
                        questionId: answer.questionId,
                    },
                },
                update: {
                    selectedOptionId,
                    isCorrect,
                    timeSpent: answer.timeSpent,
                },
                create: {
                    attemptId: normalizedAttemptId,
                    questionId: answer.questionId,
                    selectedOptionId,
                    isCorrect,
                    timeSpent: answer.timeSpent,
                },
            });
        }

        return tx.examAttempt.update({
            where: { id: normalizedAttemptId },
            data: {
                status: "SUBMITTED",
                endTime: new Date(),
                score: totalScore,
            },
        });
    });
}
