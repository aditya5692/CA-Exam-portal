"use server";

import prisma from "@/lib/prisma/client";
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

function getCachedLeaderboard(limit: number) {
    return unstable_cache(
        async () => fetchLeaderboardData(limit),
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
        console.error("[GET_GLOBAL_LEADERBOARD]", error);
        return { success: false, message: "Failed to fetch leaderboard rankings." };
    }
}
