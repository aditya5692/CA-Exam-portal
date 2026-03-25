"use server";
// Refresh: 2026-03-26-v1

import prisma from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ActionResponse } from "@/types/shared";

type ProgressData = {
    resourceType: string;
    resourceId: string;
    data: any;
};

/**
 * Saves or updates user progress for a specific resource.
 * Debounced on frontend to minimize API calls.
 */
export async function saveProgress(progress: ProgressData): Promise<ActionResponse<undefined>> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: "Unauthorized" };

        const { resourceType, resourceId, data } = progress;

        // @ts-ignore
        await (prisma as any).userProgress.upsert({
            where: {
                userId_resourceType_resourceId: {
                    userId: user.id,
                    resourceType,
                    resourceId,
                }
            },
            create: {
                userId: user.id,
                resourceType,
                resourceId,
                data: data || {},
            },
            update: {
                data: data || {},
                updatedAt: new Date(),
            }
        });

        return { success: true, message: "Progress saved", data: undefined };
    } catch (error) {
        console.error("Save progress error:", error);
        return { success: false, message: "Failed to save progress" };
    }
}

/**
 * Fetches the most recent progress for a resource or the latest activity overall.
 */
export async function resumeProgress(resourceType?: string, resourceId?: string): Promise<ActionResponse<any>> {
    try {
        const user = await getCurrentUser();
        if (!user) return { success: false, message: "Unauthorized" };

        if (resourceType && resourceId) {
            // @ts-ignore
            const progress = await (prisma as any).userProgress.findUnique({
                where: {
                    userId_resourceType_resourceId: {
                        userId: user.id,
                        resourceType,
                        resourceId,
                    }
                }
            });
            return { success: true, data: progress ? progress.data : null };
        }

        // Get latest overall activity
        // @ts-ignore
        const latestProgress = await (prisma as any).userProgress.findFirst({
            where: { userId: user.id },
            orderBy: { updatedAt: 'desc' }
        });

        return { success: true, data: latestProgress ? { ...latestProgress } : null };
    } catch (error) {
        console.error("Resume progress error:", error);
        return { success: false, message: "Failed to resume progress" };
    }
}
