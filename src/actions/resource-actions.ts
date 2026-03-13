"use server";

import prisma from "@/lib/prisma/client";
import { revalidatePath } from "next/cache";

export async function getPublicResources(filters: { category?: string; subType?: string; isTrending?: boolean }) {
    try {
        const resources = await prisma.studyMaterial.findMany({
            where: {
                isPublic: true,
                ...(filters.category && filters.category !== "All" ? { category: filters.category } : {}),
                ...(filters.subType && filters.subType !== "All" ? { subType: filters.subType } : {}),
                ...(filters.isTrending ? { isTrending: true } : {}),
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

        return resources.map(res => ({
            id: res.id,
            title: res.title,
            description: res.description,
            fileUrl: res.fileUrl,
            fileType: res.fileType,
            category: res.category,
            subType: res.subType,
            downloads: res.downloads,
            rating: res.rating,
            isTrending: res.isTrending,
            author: res.uploadedBy.fullName || "Anonymous",
            authorId: res.uploadedBy.id,
            specialty: res.uploadedBy.expertise || res.uploadedBy.designation || "Expert",
            date: new Date(res.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }));
    } catch (error) {
        console.error("Failed to fetch public resources:", error);
        return [];
    }
}

export async function incrementDownloadCount(id: string) {
    try {
        await prisma.studyMaterial.update({
            where: { id },
            data: { downloads: { increment: 1 } }
        });
        revalidatePath("/study-material");
        revalidatePath("/past-year-questions");
    } catch (error) {
        console.error("Failed to increment download count:", error);
    }
}
