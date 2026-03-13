"use server";

import prisma from "@/lib/prisma/client";

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
        console.error("Failed to fetch public profile:", error);
        return null;
    }
}
