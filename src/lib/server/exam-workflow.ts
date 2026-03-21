import "server-only";

import prisma from "@/lib/prisma/client";
import { Prisma,type ExamAttempt } from "@prisma/client";
import { clampNumber,withSerializableTransaction } from "./action-utils";

export type SubmittedExamAnswerInput = {
    questionId: string;
    selectedOptionId: string;
    timeSpent: number;
};

type StartAttemptOptions = {
    enforceVisibility?: boolean;
};

export type ExamDetailsRecord = Prisma.ExamGetPayload<{
    include: {
        questions: {
            include: {
                question: {
                    include: {
                        options: true;
                    };
                };
            };
        };
    };
}>;

export type AttemptResultsRecord = Prisma.ExamAttemptGetPayload<{
    include: {
        exam: {
            include: {
                _count: {
                    select: { questions: true };
                };
                questions: {
                    select: {
                        questionId: true;
                        marks: true;
                    };
                };
            };
        };
        answers: {
            include: {
                question: {
                    select: {
                        id: true;
                        text: true;
                        explanation: true;
                        difficulty: true;
                        subject: true;
                        topic: true;
                        options: true;
                    };
                };
                selectedOption: true;
            };
        };
    };
}>;

function normalizeId(value: string) {
    return value.trim();
}

export function calculateExamAttemptDeadline(startTime: Date, durationMinutes: number) {
    return new Date(startTime.getTime() + clampNumber(durationMinutes, 1, 24 * 60) * 60_000);
}

export function isExamAttemptExpired(
    startTime: Date,
    durationMinutes: number,
    referenceTime = new Date(),
) {
    return referenceTime.getTime() >= calculateExamAttemptDeadline(startTime, durationMinutes).getTime();
}

export function normalizeSubmittedAnswers(answers: SubmittedExamAnswerInput[]) {
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

async function expireStartedAttemptIfNeeded(
    tx: Prisma.TransactionClient,
    attempt: { id: string; status: string; startTime: Date; exam: { duration: number } },
) {
    if (attempt.status !== "STARTED" || !isExamAttemptExpired(attempt.startTime, attempt.exam.duration)) {
        return attempt;
    }

    return tx.examAttempt.update({
        where: { id: attempt.id },
        data: {
            status: "EXPIRED",
            endTime: calculateExamAttemptDeadline(attempt.startTime, attempt.exam.duration),
        },
        include: {
            exam: {
                select: {
                    duration: true,
                },
            },
        },
    });
}

export async function expireStudentStartedAttempts(studentId: string, examIds?: string[]) {
    const normalizedStudentId = normalizeId(studentId);
    if (!normalizedStudentId) {
        return 0;
    }

    return withSerializableTransaction(async (tx) => {
        const attempts = await tx.examAttempt.findMany({
            where: {
                studentId: normalizedStudentId,
                status: "STARTED",
                ...(examIds && examIds.length > 0 ? { examId: { in: examIds } } : {}),
            },
            include: {
                exam: {
                    select: {
                        duration: true,
                    },
                },
            },
        });

        let expiredCount = 0;
        for (const attempt of attempts) {
            if (!isExamAttemptExpired(attempt.startTime, attempt.exam.duration)) {
                continue;
            }

            await tx.examAttempt.update({
                where: { id: attempt.id },
                data: {
                    status: "EXPIRED",
                    endTime: calculateExamAttemptDeadline(attempt.startTime, attempt.exam.duration),
                },
            });
            expiredCount += 1;
        }

        return expiredCount;
    });
}

export async function getExamDetailsRecord(examId: string): Promise<ExamDetailsRecord | null> {
    const normalizedExamId = normalizeId(examId);
    if (!normalizedExamId) {
        throw new Error("Exam id is required.");
    }

    return prisma.exam.findUnique({
        where: { id: normalizedExamId },
        include: {
            questions: {
                orderBy: { order: "asc" },
                include: {
                    question: {
                        include: {
                            options: true,
                        },
                    },
                },
            },
        },
    });
}

function calculatePersistedAttemptScore(attempt: AttemptResultsRecord) {
    const marksByQuestionId = new Map(
        attempt.exam.questions.map((question) => [question.questionId, question.marks]),
    );

    return attempt.answers.reduce((total, answer) => {
        if (!answer.isCorrect) {
            return total;
        }

        return total + (marksByQuestionId.get(answer.questionId) ?? 0);
    }, 0);
}

export async function getExamAttemptResultsRecord(attemptId: string): Promise<AttemptResultsRecord> {
    const normalizedAttemptId = normalizeId(attemptId);
    if (!normalizedAttemptId) {
        throw new Error("Attempt id is required.");
    }

    return withSerializableTransaction(async (tx) => {
        const attemptState = await tx.examAttempt.findUnique({
            where: { id: normalizedAttemptId },
            include: {
                exam: {
                    select: {
                        duration: true,
                    },
                },
            },
        });

        if (!attemptState) {
            throw new Error("Results not found.");
        }

        await expireStartedAttemptIfNeeded(tx, attemptState);

        const attempt = await tx.examAttempt.findUnique({
            where: { id: normalizedAttemptId },
            include: {
                exam: {
                    include: {
                        _count: {
                            select: { questions: true },
                        },
                        questions: {
                            select: {
                                questionId: true,
                                marks: true,
                            },
                        },
                    },
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                text: true,
                                explanation: true,
                                difficulty: true,
                                subject: true,
                                topic: true,
                                options: true,
                            },
                        },
                        selectedOption: true,
                    },
                },
            },
        });

        if (!attempt) {
            throw new Error("Results not found.");
        }

        const recalculatedScore = calculatePersistedAttemptScore(attempt);
        if (attempt.score !== recalculatedScore) {
            const updatedAttempt = await tx.examAttempt.update({
                where: { id: normalizedAttemptId },
                data: { score: recalculatedScore },
                include: {
                    exam: {
                        include: {
                            _count: {
                                select: { questions: true },
                            },
                            questions: {
                                select: {
                                    questionId: true,
                                    marks: true,
                                },
                            },
                        },
                    },
                    answers: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    text: true,
                                    explanation: true,
                                    difficulty: true,
                                    subject: true,
                                    topic: true,
                                    options: true,
                                },
                            },
                            selectedOption: true,
                        },
                    },
                },
            });

            return updatedAttempt;
        }

        return attempt;
    });
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
            include: {
                exam: {
                    select: {
                        duration: true,
                    },
                },
            },
        });

        if (existingAttempt) {
            const currentAttempt = await expireStartedAttemptIfNeeded(tx, existingAttempt);
            if (currentAttempt.status === "STARTED") {
                return tx.examAttempt.findUniqueOrThrow({
                    where: { id: currentAttempt.id },
                });
            }
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

        if (attempt.status === "EXPIRED") {
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

        const submittedAt = new Date();
        const effectiveEndTime = isExamAttemptExpired(
            attempt.startTime,
            attempt.exam.duration,
            submittedAt,
        )
            ? calculateExamAttemptDeadline(attempt.startTime, attempt.exam.duration)
            : submittedAt;

        return tx.examAttempt.update({
            where: { id: normalizedAttemptId },
            data: {
                status: "SUBMITTED",
                endTime: effectiveEndTime,
                score: totalScore,
            },
        });
    });
}
