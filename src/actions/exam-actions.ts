"use server";

import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  getExamAttemptResultsRecord,
  getExamDetailsRecord,
  startExamAttemptRecord,
  submitExamAttemptRecord,
  type SubmittedExamAnswerInput,
} from "@/lib/server/exam-workflow";
import { revalidateExamSurfaces } from "@/lib/server/revalidation";
import type { AttemptWithResults,ExamWithQuestions } from "@/types/exam";
import { ActionResponse } from "@/types/shared";
import type { ExamAttempt } from "@prisma/client";

/**
 * Fetches the full details of an exam, including its questions and options.
 */
export async function getExamDetails(examId: string): Promise<ActionResponse<ExamWithQuestions>> {
    try {
        const exam = await getExamDetailsRecord(examId);

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

        revalidateExamSurfaces(attemptId);
        return { success: true, data: updatedAttempt, message: "Exam submitted successfully." };
    } catch (error) {
        console.error("submitExamAttempt error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to submit exam attempt.") };
    }
}

/**
 * Fetches the results of a completed exam attempt.
 */
export async function getExamResults(attemptId: string): Promise<ActionResponse<AttemptWithResults>> {
    try {
        const attempt = await getExamAttemptResultsRecord(attemptId);

        return { success: true, data: attempt as AttemptWithResults };
    } catch (error) {
        console.error("getExamResults error:", error);
        return { success: false, message: "Failed to fetch results." };
    }
}
