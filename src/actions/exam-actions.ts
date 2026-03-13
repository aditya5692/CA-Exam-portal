"use server";

import { ExamAttempt, Prisma } from "@prisma/client";
import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

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

export async function getExamDetails(examId: string): Promise<{ success: boolean; exam?: ExamWithQuestions; error?: string }> {
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

        if (!exam) return { success: false, error: "Exam not found" };

        return { success: true, exam: exam as ExamWithQuestions };
    } catch (error) {
        console.error("Error fetching exam:", error);
        return { success: false, error: "Failed to fetch exam details" };
    }
}

export async function startExamAttempt(examId: string, studentId: string): Promise<{ success: boolean; attempt?: ExamAttempt; error?: string }> {
    try {
        // Check if there's an existing active attempt
        const existingAttempt = await prisma.examAttempt.findFirst({
            where: {
                examId,
                studentId,
                status: 'STARTED'
            }
        });

        if (existingAttempt) return { success: true, attempt: existingAttempt };

        const attempt = await prisma.examAttempt.create({
            data: {
                examId,
                studentId,
                status: 'STARTED',
                startTime: new Date(),
            }
        });

        return { success: true, attempt };
    } catch (error) {
        console.error("Error starting attempt:", error);
        return { success: false, error: "Failed to start exam attempt" };
    }
}

export async function submitExamAttempt(
    attemptId: string,
    answers: { questionId: string, selectedOptionId: string, timeSpent: number }[]
): Promise<{ success: boolean; attempt?: ExamAttempt; error?: string }> {
    try {
        const attempt = await prisma.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
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
                }
            }
        });

        if (!attempt) return { success: false, error: "Attempt not found" };

        let totalScore = 0;

        // Process answers and calculate score
        for (const ans of answers) {
            const examQuestion = attempt.exam.questions.find(eq => eq.questionId === ans.questionId);
            const question = examQuestion?.question;
            const selectedOption = question?.options.find(o => o.id === ans.selectedOptionId);

            const isCorrect = selectedOption?.isCorrect || false;
            if (isCorrect && examQuestion) {
                totalScore += examQuestion.marks;
            }

            await prisma.studentAnswer.upsert({
                where: {
                    attemptId_questionId: {
                        attemptId,
                        questionId: ans.questionId
                    }
                },
                update: {
                    selectedOptionId: ans.selectedOptionId,
                    isCorrect,
                    timeSpent: ans.timeSpent
                },
                create: {
                    attemptId,
                    questionId: ans.questionId,
                    selectedOptionId: ans.selectedOptionId,
                    isCorrect,
                    timeSpent: ans.timeSpent
                }
            });
        }

        const updatedAttempt = await prisma.examAttempt.update({
            where: { id: attemptId },
            data: {
                status: 'SUBMITTED',
                endTime: new Date(),
                score: totalScore
            }
        });

        revalidatePath(`/student/results/${attemptId}`);
        return { success: true, attempt: updatedAttempt };
    } catch (error) {
        console.error("Error submitting attempt:", error);
        return { success: false, error: "Failed to submit exam attempt" };
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

export async function getExamResults(attemptId: string): Promise<{ success: boolean; attempt?: AttemptWithResults; error?: string }> {
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

        if (!attempt) return { success: false, error: "Results not found" };

        return { success: true, attempt: attempt as AttemptWithResults };
    } catch (error) {
        console.error("Error fetching results:", error);
        return { success: false, error: "Failed to fetch results" };
    }
}
