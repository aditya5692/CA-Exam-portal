"use server";

import { requireAuth } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  getAdaptiveQuestionInsights,
  saveLearningProgressForExam,
  type AdaptiveQuestionInsight,
  type LearningResult,
  type QuestionResult,
} from "@/lib/server/learning-progress";
import { getStudentStudyRecommendations } from "@/lib/server/study-intelligence";
import type { StudentStudyRecommendations } from "@/types/learning";
import { ActionResponse } from "@/types/shared";

/**
 * Saves exam results and calculates adaptive learning progress for a student.
 */
export async function saveExamResultsAndUpdateLearning(
    studentId: string,
    examId: string,
    attemptId: string,
    questionResults: QuestionResult[]
): Promise<ActionResponse<LearningResult>> {
    try {
        const learningResult = await saveLearningProgressForExam(
            studentId,
            examId,
            attemptId,
            questionResults,
        );

        return {
            success: true,
            data: learningResult,
            message: "Progress updated successfully."
        };
    } catch (error) {
        console.error("saveExamResultsAndUpdateLearning error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to update learning progress.") };
    }
}

/**
 * Fetches adaptive next questions/topics for a student based on their weaknesses.
 */
export async function getAdaptiveNextQuestions(
    studentId: string,
    subject: string,
    limit = 10,
): Promise<ActionResponse<AdaptiveQuestionInsight[]>> {
    try {
        return {
            success: true,
            data: await getAdaptiveQuestionInsights(studentId, subject, limit),
        };
    } catch (error) {
        console.error("getAdaptiveNextQuestions error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to fetch adaptive questions.") };
    }
}

export async function getMyStudyRecommendations(
    limit = 6,
): Promise<ActionResponse<StudentStudyRecommendations>> {
    try {
        const student = await requireAuth(["STUDENT", "ADMIN"]);
        return {
            success: true,
            data: await getStudentStudyRecommendations(student.id, limit),
        };
    } catch (error) {
        console.error("getMyStudyRecommendations error:", error);
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to fetch study recommendations."),
        };
    }
}
