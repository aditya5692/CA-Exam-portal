"use server";

import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  getExamAttemptResultsRecord,
  getExamDetailsRecord,
  saveExamProgressRecord,
  startExamAttemptRecord,
  submitExamAttemptRecord,
  type SubmittedExamAnswerInput,
} from "@/lib/server/exam-workflow";
import { revalidateExamSurfaces } from "@/lib/server/revalidation";
import type { AttemptWithResults,ExamWithQuestions } from "@/types/exam";
import { ActionResponse } from "@/types/shared";
import type { ExamAttempt } from "@prisma/client";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

/**
 * Fetches the full details of an exam, including its questions and options.
 * Enforces enrollment visibility for students.
 */
export async function getExamDetails(examId: string): Promise<ActionResponse<ExamWithQuestions>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN", "TEACHER"]);
        
        // Hard visibility check for students
        if (user.role === "STUDENT") {
            const exam = await prisma.exam.findUnique({
                where: { id: examId },
                select: { batchId: true, status: true }
            });
            
            if (!exam) return { success: false, message: "Exam not found." };
            if (exam.status !== "PUBLISHED") return { success: false, message: "This exam is not yet published." };
            
            if (exam.batchId) {
                const enrollment = await prisma.enrollment.findUnique({
                    where: {
                        studentId_batchId: {
                            studentId: user.id,
                            batchId: exam.batchId
                        }
                    }
                });
                if (!enrollment) {
                    return { success: false, message: "You are not authorized to access this exam (batch restricted)." };
                }
            }
        }

        const examData = await getExamDetailsRecord(examId);
        if (!examData) return { success: false, message: "Exam not found." };

        return { success: true, data: examData as ExamWithQuestions };
    } catch (error) {
        console.error("getExamDetails error:", error);
        return { success: false, message: "Failed to fetch exam details." };
    }
}

/**
 * Finalizes an exam attempt, calculating the score and saving student answers.
 * Verifies attempt ownership for students.
 */
export async function submitExamAttempt(
    attemptId: string,
    answers: SubmittedExamAnswerInput[]
): Promise<ActionResponse<ExamAttempt>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
        
        // Ownership check for students
        if (user.role === "STUDENT") {
            const attempt = await prisma.examAttempt.findUnique({
                where: { id: attemptId },
                select: { studentId: true }
            });
            if (!attempt || attempt.studentId !== user.id) {
                return { success: false, message: "Unauthorized submission: Attempt does not belong to you." };
            }
        }

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
 * Verifies ownership or staff access.
 */
export async function getExamResults(attemptId: string): Promise<ActionResponse<AttemptWithResults>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN", "TEACHER"]);
        
        // Ownership check for students (Staff/Admins can see all)
        if (user.role === "STUDENT") {
            const attempt = await prisma.examAttempt.findUnique({
                where: { id: attemptId },
                select: { studentId: true }
            });
            if (!attempt || attempt.studentId !== user.id) {
                return { success: false, message: "Unauthorized access to these results." };
            }
        }

        const attempt = await getExamAttemptResultsRecord(attemptId);

        return { success: true, data: attempt as AttemptWithResults };
    } catch (error) {
        console.error("getExamResults error:", error);
        return { success: false, message: "Failed to fetch results." };
    }
}

/**
 * Starts (or resumes) an exam attempt for the current student.
 * Returns the attempt metadata and any existing answers.
 */
export async function startMyExamAttempt(
    examId: string,
    mode: "MOCK" | "PRACTICE" = "MOCK"
): Promise<ActionResponse<{ 
    attemptId: string, 
    studentId: string,
    startTime: Date,
    duration: number,
    existingAnswers: any[]
}>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);
        const attempt = await startExamAttemptRecord(examId, user.id, { enforceVisibility: true, mode });

        return { 
            success: true, 
            data: { 
                attemptId: attempt.id, 
                studentId: user.id,
                startTime: attempt.startTime,
                duration: (attempt as any).exam?.duration ?? 60,
                existingAnswers: (attempt as any).answers ?? []
            } 
        };
    } catch (err) {
        console.error("startMyExamAttempt error:", err);
        return { success: false, message: getActionErrorMessage(err, "Failed to start attempt.") };
    }
}

/**
 * Saves exam progress incrementally.
 */
export async function saveExamProgress(
    attemptId: string, 
    answers: SubmittedExamAnswerInput[]
): Promise<ActionResponse<undefined>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
        
        // Ownership check
        if (user.role === "STUDENT") {
            const attempt = await prisma.examAttempt.findUnique({
                where: { id: attemptId },
                select: { studentId: true }
            });
            if (!attempt || attempt.studentId !== user.id) {
                return { success: false, message: "Unauthorized progress saving." };
            }
        }

        await saveExamProgressRecord(attemptId, answers);
        return { success: true, data: undefined };
    } catch (error) {
        console.error("saveExamProgress error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to save progress.") };
    }
}
