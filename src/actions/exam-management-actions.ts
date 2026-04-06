"use server";

import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { revalidateAdminSurfaces, revalidateExamSurfaces } from "@/lib/server/revalidation";
import { ActionResponse } from "@/types/shared";
import { revalidatePath } from "next/cache";

/**
 * Deletes one or more exams from the platform.
 * Admins can delete any exam. Teachers can only delete their own exams.
 */
export async function deleteExams(examIds: string[]): Promise<ActionResponse<void>> {
    try {
        if (!examIds || examIds.length === 0) {
            return { success: false, message: "No exams specified for deletion." };
        }

        const user = await requireAuth(["TEACHER", "ADMIN"]);

        // If user is a teacher (not admin), verify they own all exams being deleted
        if (user.role !== "ADMIN") {
            const forbiddenExams = await prisma.exam.findMany({
                where: {
                    id: { in: examIds },
                    teacherId: { not: user.id }
                },
                select: { id: true }
            });

            if (forbiddenExams.length > 0) {
                return { 
                    success: false, 
                    message: "Permission denied. You can only delete exams that you created." 
                };
            }
        }

        // Perform deletion of exams (Cascade will handle ExamQuestion and ExamAttempt)
        const { count } = await prisma.exam.deleteMany({
            where: {
                id: { in: examIds }
            }
        });

        // Clean up orphaned questions (questions not linked to any exam)
        // This is safe because questions in this portal are currently created per exam
        await prisma.question.deleteMany({
            where: {
                exams: {
                    none: {}
                }
            }
        });

        // Revalidate surfaces
        revalidatePath("/teacher/dashboard");
        revalidatePath("/teacher/test-series");
        revalidatePath("/student/dashboard");
        revalidateExamSurfaces();
        revalidateAdminSurfaces(); // Ensure all dashboard stats are updated

        return { 
            success: true, 
            message: count === 1 ? "Test series deleted successfully." : `${count} test series deleted successfully.`,
            data: undefined
        };
    } catch (error) {
        console.error("deleteExams error:", error);
        return { 
            success: false, 
            message: getActionErrorMessage(error, "Failed to delete test series.") 
        };
    }
}
