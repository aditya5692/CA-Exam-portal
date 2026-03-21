"use server";

import prisma from "@/lib/prisma/client";
import { getActionErrorMessage } from "@/lib/server/action-utils";
import {
  getPublicResourceCatalogInsights,
  listPublicResources,
} from "@/lib/server/resource-intelligence";
import type {
  PublicResource,
  PublicResourceCatalogInsight,
  PublicResourceFilters,
} from "@/types/resource";
import { ActionResponse } from "@/types/shared";
import { revalidatePath } from "next/cache";

function normalizeResourceId(id: string) {
    const normalized = id.trim();
    if (!normalized) {
        throw new Error("Resource id is required.");
    }

    return normalized;
}

async function incrementPublicResourceMetric(
    id: string,
    field: "downloads" | "shareCount",
    expectedSubType?: string,
) {
    const normalizedId = normalizeResourceId(id);
    const updatedResources = await prisma.studyMaterial.updateMany({
        where: {
            id: normalizedId,
            isPublic: true,
            ...(expectedSubType ? { subType: expectedSubType } : {}),
        },
        data: {
            [field]: {
                increment: 1,
            },
        },
    });

    if (updatedResources.count === 0) {
        throw new Error("Resource not found.");
    }
}

/**
 * Fetches public study materials based on filters.
 */
export async function getPublicResources(filters: PublicResourceFilters): Promise<ActionResponse<PublicResource[]>> {
    try {
        return { success: true, data: await listPublicResources(filters) };
    } catch (error) {
        console.error("getPublicResources error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to fetch public resources.") };
    }
}

/**
 * Increments the download count for a study material.
 */
export async function incrementDownloadCount(id: string): Promise<ActionResponse<void>> {
    try {
        await incrementPublicResourceMetric(id, "downloads");
        revalidatePath("/study-material");
        revalidatePath("/student/past-year-questions");
        revalidatePath("/past-year-questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("incrementDownloadCount error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to increment download count.") };
    }
}

/**
 * Tracks a Past Year Question (PYQ) action like download or share.
 */
export async function trackPYQAction(id: string, action: "DOWNLOAD" | "SHARE"): Promise<ActionResponse<void>> {
    try {
        if (action === "DOWNLOAD") {
            await incrementPublicResourceMetric(id, "downloads", "PYQ");
        } else {
            await incrementPublicResourceMetric(id, "shareCount", "PYQ");
        }
        revalidatePath("/student/past-year-questions");
        revalidatePath("/past-year-questions");
        return { success: true, data: undefined };
    } catch (error) {
        console.error("trackPYQAction error:", error);
        return { success: false, message: getActionErrorMessage(error, `Failed to track ${action}.`) };
    }
}

export async function getPublicResourceInsights(
    filters: PublicResourceFilters = {},
): Promise<ActionResponse<PublicResourceCatalogInsight>> {
    try {
        return {
            success: true,
            data: await getPublicResourceCatalogInsights(filters),
        };
    } catch (error) {
        console.error("getPublicResourceInsights error:", error);
        return {
            success: false,
            message: getActionErrorMessage(error, "Failed to fetch resource insights."),
        };
    }
}
