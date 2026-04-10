"use server";

import { requireAuth } from "@/lib/auth/session";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  listStudentVisibleExams,
  listTeacherBatchOptions,
  publishExamFromVaultIds,
  publishExamQuestions,
} from "@/lib/server/exam-publishing";
import { revalidatePath } from "next/cache";
import { PublishTarget } from "@/types/publish-exam";
import { revalidateExamSurfaces } from "@/lib/server/revalidation";
import prisma from "@/lib/prisma/client";
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
        const teacher = await requireAuth(["TEACHER", "ADMIN"]);
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
        const teacher = await requireAuth(["TEACHER", "ADMIN"]);

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
        const student = await requireAuth(["STUDENT"]);

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

/**
 * Fetches all publicly available (global) exams.
 */
export async function getPublicMockExams(): Promise<ActionResponse<StudentVisibleExam[]>> {
    try {
        const exams = await prisma.exam.findMany({
            where: {
                status: "PUBLISHED",
                batchId: null,
            },
            include: {
                teacher: { select: { fullName: true, email: true } },
                _count: { select: { questions: true, attempts: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        const data: StudentVisibleExam[] = exams.map((exam: any) => ({
            id: exam.id,
            title: exam.title,
            duration: exam.duration,
            totalMarks: exam.totalMarks,
            category: exam.category,
            subject: exam.subject ?? "General",
            chapter: exam.chapter ?? "General",
            batchName: null,
            teacherName: exam.teacher.fullName ?? exam.teacher.email ?? "Teacher",
            questionCount: exam._count.questions,
            attemptCount: exam._count.attempts,
            examType: exam.examType,
            attempt: null, // No attempt context for public view
        }));

        return {
            success: true,
            data,
        };
    } catch (err) {
        console.error("getPublicMockExams error:", err);
        const { getActionErrorMessage } = await import("@/lib/server/action-utils");
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to fetch public exams."),
        };
    }
}

/**
 * Publishes an exam using existing questions from the Question Bank (Vault).
 */
export async function createExamFromVault(input: {
    title: string;
    caLevel: "foundation" | "ipc" | "final";
    subject: string;
    chapter?: string;
    durationMinutes: number;
    examType: string;
    target: PublishTarget;
    questionIds: string[];
}): Promise<ActionResponse<PublishExamResultData>> {
    try {
        const teacher = await requireAuth(["TEACHER", "ADMIN"]);
        
        if (!input.questionIds || input.questionIds.length === 0) {
            return { success: false, message: "Please select at least one question." };
        }

        const data = await publishExamFromVaultIds(teacher, input);
        
        revalidateExamSurfaces();
        revalidatePath("/teacher/test-series");

        return {
            success: true,
            message: "Test series created successfully from Question Bank.",
            data,
        };
    } catch (err) {
        console.error("createExamFromVault error:", err);
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to create test series."),
        };
    }
}
