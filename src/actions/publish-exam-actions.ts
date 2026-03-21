"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  listStudentVisibleExams,
  listTeacherBatchOptions,
  publishExamQuestions,
} from "@/lib/server/exam-publishing";
import { revalidateExamSurfaces } from "@/lib/server/revalidation";
import type {
  BatchOption,
  PublishExamInput,
  PublishExamResultData,
  StudentVisibleExam,
} from "@/types/publish-exam";
import { ActionResponse } from "@/types/shared";

/**
 * Publishes an exam from a list of parsed questions.
 */
export async function publishExamFromQuestions(
    input: PublishExamInput
): Promise<ActionResponse<PublishExamResultData>> {
    try {
        const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);
        const publishedExam = await publishExamQuestions(teacher, input);

        revalidateExamSurfaces();
        return {
            success: true,
            message: "Exam published successfully.",
            data: publishedExam,
        };
    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to publish exam."),
        };
    }
}

/**
 * Fetches batches available for publishing for the current teacher.
 */
export async function getTeacherBatchOptions(): Promise<ActionResponse<BatchOption[]>> {
    try {
        const teacher = await getCurrentUserOrDemoUser("TEACHER", ["TEACHER", "ADMIN"]);

        return {
            success: true,
            data: await listTeacherBatchOptions(teacher),
        };
    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to fetch batches."),
        };
    }
}

/**
 * Fetches all exams visible to the current student based on their CA level and batch enrollments.
 */
export async function getStudentVisibleExams(
    caLevel: "foundation" | "ipc" | "final"
): Promise<ActionResponse<StudentVisibleExam[]>> {
    try {
        const student = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);

        return {
            success: true,
            data: await listStudentVisibleExams(student.id, caLevel),
        };
    } catch (err) {
        console.error("getStudentVisibleExams error:", err);
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to fetch exams."),
        };
    }
}
