"use server";

import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import { unstable_cache } from "next/cache";

function shouldSuppressPublicDataError(error: unknown) {
    const message = getActionErrorMessage(error, "Public data fallback");
    return (
        message === "The database connection is temporarily unavailable. Please try again." ||
        message === "The database is temporarily unavailable. Please try again." ||
        message === "The database configuration is invalid. Please check the server environment."
    );
}

const FALLBACK_GLOBAL_METRICS = {
    studentCount: 0,
    mcqCount: 0,
    resourceCount: 0,
    batchCount: 0,
    lastUpdate: new Date().toISOString(),
};

const getCachedGlobalMetrics = unstable_cache(
    async () => {
        try {
            const [studentCount, mcqCount, resourceCount, batchCount] = await Promise.all([
                prisma.user.count({ where: { role: "STUDENT" } }),
                prisma.question.count({}),
                prisma.studyMaterial.count({}),
                prisma.batch.count({}),
            ]);

            return {
                studentCount,
                mcqCount,
                resourceCount,
                batchCount,
                lastUpdate: new Date().toISOString(),
            };
        } catch (error) {
            if (!shouldSuppressPublicDataError(error)) {
                console.error("Failed to fetch global metrics:", error);
            }
            return {
                ...FALLBACK_GLOBAL_METRICS,
                lastUpdate: new Date().toISOString(),
            };
        }
    },
    ["public-global-metrics"],
    {
        revalidate: 3600,
        tags: ["public-metrics"],
    },
);

export async function getPublicEducatorProfile(id: string) {
    try {
        const educator = await prisma.user.findFirst({
            where: {
                id,
                role: "TEACHER",
                isPublicProfile: true
            },
            select: {
                id: true,
                fullName: true,
                designation: true,
                expertise: true,
                bio: true,
                materialsUploaded: {
                    select: { id: true },
                    where: { isPublic: true }
                },
                batchesTeaching: {
                    select: { id: true }
                }
            }
        });

        if (!educator) return null;

        return {
            id: educator.id,
            fullName: educator.fullName || "Anonymous Educator",
            designation: educator.designation || "Educator",
            expertise: educator.expertise || "General",
            bio: educator.bio,
            totalMaterials: educator.materialsUploaded.length,
            totalBatches: educator.batchesTeaching.length
        };
    } catch (error) {
        if (!shouldSuppressPublicDataError(error)) {
            console.error("Failed to fetch public profile:", error);
        }
        return null;
    }
}

export async function getGlobalMetrics() {
    try {
        return await getCachedGlobalMetrics();
    } catch (error) {
        if (!shouldSuppressPublicDataError(error)) {
            console.error("Failed to fetch global metrics:", error);
        }
        return {
            ...FALLBACK_GLOBAL_METRICS,
            lastUpdate: new Date().toISOString(),
        };
    }
}
