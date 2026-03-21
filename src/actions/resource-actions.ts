"use server";

import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";
import { ActionResponse } from "@/types/shared";

export type PublicResource = {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    category: string;
    subType: string;
    providerType: string;
    downloads: number;
    shareCount: number;
    rating: number;
    isTrending: boolean;
    author: string;
    createdAt: Date;
    authorId: string | null;
    specialty: string;
    date: string;
};

/**
 * Fetches public study materials based on filters.
 */
export async function getPublicResources(filters: { category?: string; subType?: string; isTrending?: boolean; search?: string }): Promise<ActionResponse<PublicResource[]>> {
    try {
        const resources = await prisma.studyMaterial.findMany({
            where: {
                isPublic: true,
                ...(filters.category && filters.category !== "All" ? { category: filters.category } : {}),
                ...(filters.subType && filters.subType !== "All" ? { subType: filters.subType } : {}),
                ...(filters.isTrending ? { isTrending: true } : {}),
                ...(filters.search ? {
                    OR: [
                        { title: { contains: filters.search, mode: 'insensitive' } },
                        { description: { contains: filters.search, mode: 'insensitive' } },
                    ]
                } : {}),
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        fullName: true,
                        designation: true,
                        expertise: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const formatted: PublicResource[] = resources.map((res) => ({
            id: res.id,
            title: res.title,
            description: res.description,
            fileUrl: res.fileUrl,
            fileType: res.fileType,
            category: res.category,
            subType: res.subType,
            providerType: res.providerType,
            downloads: res.downloads,
            shareCount: res.shareCount,
            rating: res.rating,
            isTrending: res.isTrending,
            author: res.uploadedBy?.fullName || "Anonymous",
            authorId: res.uploadedBy?.id || null,
            createdAt: res.createdAt,
            specialty: res.uploadedBy?.expertise || res.uploadedBy?.designation || "Expert",
            date: new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));

        return { success: true, data: formatted };
    } catch (error) {
        console.error("getPublicResources error:", error);
        return { success: false, message: "Failed to fetch public resources." };
    }
}

/**
 * Increments the download count for a study material.
 */
export async function incrementDownloadCount(id: string): Promise<ActionResponse<void>> {
    try {
        await prisma.studyMaterial.update({
            where: { id },
            data: { downloads: { increment: 1 } }
        });
        revalidatePath("/study-material");
        revalidatePath("/student/past-year-questions");
        revalidatePath("/past-year-questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("incrementDownloadCount error:", error);
        return { success: false, message: "Failed to increment download count." };
    }
}

/**
 * Tracks a Past Year Question (PYQ) action like download or share.
 */
export async function trackPYQAction(id: string, action: "DOWNLOAD" | "SHARE"): Promise<ActionResponse<void>> {
    try {
        if (action === "DOWNLOAD") {
            await prisma.studyMaterial.update({
                where: { id },
                data: { downloads: { increment: 1 } }
            });
        } else {
            await prisma.studyMaterial.update({
                where: { id },
                data: { shareCount: { increment: 1 } }
            });
        }
        revalidatePath("/student/past-year-questions");
        revalidatePath("/past-year-questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("trackPYQAction error:", error);
        return { success: false, message: `Failed to track ${action}.` };
    }
}
