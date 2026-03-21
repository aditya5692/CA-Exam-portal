"use server";

import { ExamAttempt, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { startExamAttemptRecord, submitExamAttemptRecord, type SubmittedExamAnswerInput } from "@/lib/server/exam-workflow";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { ActionResponse } from "@/types/shared";

export type ExamWithQuestions = Prisma.ExamGetPayload<{
    include: {
        questions: {
            include: {
                question: {
                    include: {
                        options: true
                    }
                }
            }
        }
    }
}>;

/**
 * Fetches the full details of an exam, including its questions and options.
 */
export async function getExamDetails(examId: string): Promise<ActionResponse<ExamWithQuestions>> {
    try {
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    include: {
                        question: {
                            include: {
                                options: true,
                            }
                        }
                    }
                }
            }
        });

        if (!exam) return { success: false, message: "Exam not found." };

        return { success: true, data: exam as ExamWithQuestions };
    } catch (error) {
        console.error("getExamDetails error:", error);
        return { success: false, message: "Failed to fetch exam details." };
    }
}

/**
 * Initializes a new exam attempt for a student or returns an existing active attempt.
 */
export async function startExamAttempt(examId: string, studentId: string): Promise<ActionResponse<ExamAttempt>> {
    try {
        const attempt = await startExamAttemptRecord(examId, studentId);

        return { success: true, data: attempt };
    } catch (error) {
        console.error("startExamAttempt error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to start exam attempt.") };
    }
}

/**
 * Finalizes an exam attempt, calculating the score and saving student answers.
 */
export async function submitExamAttempt(
    attemptId: string,
    answers: SubmittedExamAnswerInput[]
): Promise<ActionResponse<ExamAttempt>> {
    try {
        const updatedAttempt = await submitExamAttemptRecord(attemptId, answers);

        revalidatePath(`/student/results/${attemptId}`);
        revalidatePath("/student/exams");
        return { success: true, data: updatedAttempt, message: "Exam submitted successfully." };
    } catch (error) {
        console.error("submitExamAttempt error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to submit exam attempt.") };
    }
}

export type AttemptWithResults = Prisma.ExamAttemptGetPayload<{
    include: {
        exam: {
            include: {
                _count: {
                    select: { questions: true }
                }
            }
        },
        answers: {
            include: {
                question: {
                    include: {
                        options: true
                    }
                },
                selectedOption: true
            }
        }
    }
}>;

/**
 * Fetches the results of a completed exam attempt.
 */
export async function getExamResults(attemptId: string): Promise<ActionResponse<AttemptWithResults>> {
    try {
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: {
                        _count: {
                            select: { questions: true }
                        }
                    }
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                text: true,
                                explanation: true,
                                difficulty: true,
                                subject: true,
                                topic: true,
                                options: true,
                            }
                        },
                        selectedOption: true
                    }
                }
            }
        });

        if (!attempt) return { success: false, message: "Results not found." };

        return { success: true, data: attempt as AttemptWithResults };
    } catch (error) {
        console.error("getExamResults error:", error);
        return { success: false, message: "Failed to fetch results." };
    }
}
