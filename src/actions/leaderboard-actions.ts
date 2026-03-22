"use server";

import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { ActionResponse } from "@/types/shared";
import { unstable_cache } from "next/cache";

export type LeaderboardEntry = {
    rank: number;
    studentId: string;
    fullName: string;
    totalXP: number;
    level: number;
};

async function fetchLeaderboardData(limit: number): Promise<LeaderboardEntry[]> {
    const topProfiles = await prisma.studentLearningProfile.findMany({
        where: {
            student: {
                role: "STUDENT",
                isPublicProfile: true, // Respect privacy settings
            },
        },
        orderBy: [
            { totalXP: "desc" },
            { updatedAt: "asc" },
        ],
        take: limit,
        include: {
            student: {
                select: {
                    fullName: true,
                    registrationNumber: true,
                },
            },
        },
    });

    return topProfiles.map((p, index) => ({
        rank: index + 1,
        studentId: p.studentId,
        fullName: p.student.fullName || p.student.registrationNumber || "Student",
        totalXP: p.totalXP,
        level: p.level,
    }));
}

function shouldSuppressPublicDataError(error: unknown) {
    const message = getActionErrorMessage(error, "Failed to fetch leaderboard rankings.");
    return (
        message === "The database connection is temporarily unavailable. Please try again." ||
        message === "The database is temporarily unavailable. Please try again." ||
        message === "The database configuration is invalid. Please check the server environment."
    );
}

function getCachedLeaderboard(limit: number) {
    return unstable_cache(
        async () => {
            try {
                return await fetchLeaderboardData(limit);
            } catch (error) {
                if (!shouldSuppressPublicDataError(error)) {
                    console.error("[GET_GLOBAL_LEADERBOARD]", error);
                }
                return [];
            }
        },
        [`global-leaderboard-cache-${limit}`],
        {
            revalidate: 3600,
            tags: ["leaderboard"],
        }
    )();
}

/**
 * Fetches the global leaderboard, cached for 1 hour.
 */
export async function getGlobalLeaderboard(limit = 100): Promise<ActionResponse<LeaderboardEntry[]>> {
    try {
        const data = await getCachedLeaderboard(limit);
        return { success: true, data };
    } catch (error) {
        if (!shouldSuppressPublicDataError(error)) {
            console.error("[GET_GLOBAL_LEADERBOARD]", error);
        }
        return { success: false, message: "Failed to fetch leaderboard rankings." };
    }
}

/**
 * Fetches the rank and percentile for a specific user.
 */
export async function getUserRank(userId: string): Promise<ActionResponse<{ rank: number; percentile: number; totalXP: number; level: number }>> {
    try {
        const allProfiles = await prisma.studentLearningProfile.findMany({
            select: { studentId: true, totalXP: true, level: true },
            orderBy: [
                { totalXP: 'desc' },
                { updatedAt: 'asc' }
            ]
        });

        const myIndex = allProfiles.findIndex(p => p.studentId === userId);
        if (myIndex === -1) {
            return { success: false, message: "User profile not found." };
        }

        const total = allProfiles.length;
        const rank = myIndex + 1;
        const percentile = Math.round(((total - rank) / total) * 100);

        return { 
            success: true, 
            data: { 
                rank, 
                percentile, 
                totalXP: allProfiles[myIndex].totalXP,
                level: allProfiles[myIndex].level
            } 
        };
    } catch {
        return { success: false, message: "Failed to fetch user rank." };
    }
}
