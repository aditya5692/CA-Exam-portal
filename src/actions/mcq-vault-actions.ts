"use server";

import prisma from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ParsedQuestion } from "@/types/publish-exam";
import { ActionResponse } from "@/types/shared";

/**
 * Fetches all questions owned by the current teacher.
 */
export async function getVaultQuestions(): Promise<ActionResponse<any[]>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);
        const questions = await prisma.question.findMany({
            where: { teacherId: user.id },
            include: { options: true },
            orderBy: { createdAt: "desc" },
        });

        // Map to a cleaner format if needed, but the UI can handle the Prisma object
        return { success: true, data: questions };
    } catch (error) {
        console.error("getVaultQuestions error:", error);
        return { success: false, message: "Failed to fetch vault questions." };
    }
}

/**
 * Bulk saves questions to the teacher's vault.
 */
export async function saveQuestionsToVault(questions: ParsedQuestion[]): Promise<ActionResponse<void>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);

        // Use a transaction for bulk creation
        await prisma.$transaction(
            questions.map((q) =>
                prisma.question.create({
                    data: {
                        text: q.prompt,
                        subject: q.subject,
                        topic: q.topic,
                        difficulty: q.difficulty,
                        explanation: q.explanation,
                        teacherId: user.id,
                        options: {
                            create: q.options.map((opt, idx) => ({
                                text: opt,
                                isCorrect: q.correct.includes(idx),
                            })),
                        },
                    },
                })
            )
        );

        revalidatePath("/teacher/questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("saveQuestionsToVault error:", error);
        return { success: false, message: "Failed to save questions to vault." };
    }
}

/**
 * Deletes a question from the vault.
 */
export async function deleteVaultQuestion(id: string): Promise<ActionResponse<void>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);

        // Verify ownership
        const question = await prisma.question.findUnique({
            where: { id },
            select: { teacherId: true },
        });

        if (!question || question.teacherId !== user.id) {
            throw new Error("Question not found or unauthorized.");
        }

        await prisma.question.delete({ where: { id } });

        revalidatePath("/teacher/questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("deleteVaultQuestion error:", error);
        return { success: false, message: "Failed to delete question." };
    }
}

/**
 * Updates a vault question. (Minimal implementation for now)
 */
export async function updateVaultQuestion(id: string, data: Partial<ParsedQuestion>): Promise<ActionResponse<void>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);

        const question = await prisma.question.findUnique({
            where: { id },
            select: { teacherId: true },
        });

        if (!question || question.teacherId !== user.id) {
            throw new Error("Question not found or unauthorized.");
        }

        // Handle options update if provided
        if (data.options || data.correct) {
             // For simplicity in this demo, we delete and recreate options if they change
             // In a production app, we'd sync them by ID
              if (data.options) {
                  await prisma.option.deleteMany({ where: { questionId: id } });
                  await prisma.option.createMany({
                      data: data.options.map((opt, idx) => ({
                          text: opt,
                          isCorrect: data.correct?.includes(idx) ?? false,
                          questionId: id,
                      }))
                  });
              }
        }

        await prisma.question.update({
            where: { id },
            data: {
                text: data.prompt,
                subject: data.subject,
                topic: data.topic,
                difficulty: data.difficulty,
                explanation: data.explanation,
            },
        });

        revalidatePath("/teacher/questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("updateVaultQuestion error:", error);
        return { success: false, message: "Failed to update question." };
    }
}
