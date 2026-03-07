"use server";

import prisma from "@/lib/prisma/client";

export async function saveExamAttempt(attemptId: string, answers: Record<string, string | number | boolean>) {
    console.log(`Server Action: Saving attempt ${attemptId}`);

    try {
        // In a real app:
        // await prisma.attempt.update({
        //   where: { id: attemptId },
        //   data: { rawAnswers: answers, status: 'SUBMITTED', submittedAt: new Date() }
        // })
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function getExamResults(studentId: string) {
    // return await prisma.attempt.findMany({ where: { studentId } })
    return [];
}
