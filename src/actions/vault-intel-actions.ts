"use server";

import prisma from "@/lib/prisma/client";
import { requireAuth } from "@/lib/auth/session";
import { ActionResponse } from "@/types/shared";
import { getActionErrorMessage } from "@/lib/server/action-utils";

export type VaultIntel = {
    subjects: string[];
    chaptersBySubject: Record<string, { name: string; count: number }[]>;
    totalCount: number;
};

/**
 * Retrieves unique subjects and chapters (topics) from the teacher's vault.
 */
export async function getVaultIntel(): Promise<ActionResponse<VaultIntel>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);

        const questions = await prisma.question.findMany({
            where: { teacherId: user.id },
            select: { subject: true, topic: true },
        });

        const subjectsSet = new Set<string>();
        const chaptersMap: Record<string, Map<string, number>> = {};

        questions.forEach(q => {
            const subject = q.subject || "Uncategorized";
            const topic = q.topic || "General";

            subjectsSet.add(subject);

            if (!chaptersMap[subject]) {
                chaptersMap[subject] = new Map();
            }

            const currentCount = chaptersMap[subject].get(topic) || 0;
            chaptersMap[subject].set(topic, currentCount + 1);
        });

        const chaptersBySubject: Record<string, { name: string; count: number }[]> = {};
        Object.keys(chaptersMap).forEach(sub => {
            chaptersBySubject[sub] = Array.from(chaptersMap[sub].entries()).map(([name, count]) => ({
                name,
                count
            }));
        });

        return {
            success: true,
            data: {
                subjects: Array.from(subjectsSet).sort(),
                chaptersBySubject,
                totalCount: questions.length
            }
        };

    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to retrieve vault intelligence.")
        };
    }
}

export type HarvestRecipe = {
    subject: string;
    chapters: { name: string; count: number }[];
};

/**
 * Harvests random question IDs from the vault based on a provided recipe.
 */
export async function harvestQuestions(recipe: HarvestRecipe): Promise<ActionResponse<string[]>> {
    try {
        const user = await requireAuth(["TEACHER", "ADMIN"]);
        const allIds: string[] = [];

        for (const chapter of recipe.chapters) {
            if (chapter.count <= 0) continue;

            const questions = await prisma.question.findMany({
                where: {
                    teacherId: user.id,
                    subject: recipe.subject === "Uncategorized" ? null : recipe.subject,
                    topic: chapter.name === "General" ? null : chapter.name,
                },
                select: { id: true },
            });

            // Randomly shuffle and take the requested count
            const shuffled = questions
                .map(q => q.id)
                .sort(() => Math.random() - 0.5)
                .slice(0, chapter.count);

            allIds.push(...shuffled);
        }

        return {
            success: true,
            data: Array.from(new Set(allIds)) // Ensure uniqueness
        };

    } catch (err) {
        return {
            success: false,
            message: getActionErrorMessage(err, "Failed to harvest questions.")
        };
    }
}
