import "server-only";

import {
  CA_FINAL_CONTENT,
  CA_FOUNDATION_CONTENT,
  CA_INTER_CONTENT,
} from "@/lib/constants/chapters";
import prisma from "@/lib/prisma/client";
import type {
  PublicResource,
  PublicResourceCatalogInsight,
  PublicResourceFilters,
} from "@/types/resource";

type PublicResourceRecord = {
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
    createdAt: Date;
    uploadedBy: {
        id: string;
        fullName: string | null;
        designation: string | null;
        expertise: string | null;
    } | null;
};

type InferredResourceMetadata = {
    level: string | null;
    subject: string | null;
    chapter: string | null;
    searchText: string;
};

const LEVEL_INDEX = [
    { level: "CA Foundation", content: CA_FOUNDATION_CONTENT },
    { level: "CA Intermediate", content: CA_INTER_CONTENT },
    { level: "CA Final", content: CA_FINAL_CONTENT },
];

function normalizeOptionalFilter(value: string | undefined) {
    const normalized = value?.trim();
    return normalized && normalized !== "All" ? normalized : null;
}

function tokenizeSearch(search: string | undefined) {
    return (search ?? "")
        .toLowerCase()
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);
}

function buildSearchText(resource: PublicResourceRecord) {
    return [
        resource.title,
        resource.description ?? "",
        resource.category,
        resource.subType,
        resource.providerType,
        resource.uploadedBy?.fullName ?? "",
        resource.uploadedBy?.designation ?? "",
        resource.uploadedBy?.expertise ?? "",
    ].join(" ").toLowerCase();
}

export function inferPublicResourceMetadata(resource: Pick<
    PublicResourceRecord,
    "title" | "description" | "category" | "subType" | "providerType" | "uploadedBy"
>): InferredResourceMetadata {
    const searchText = buildSearchText({
        ...resource,
        id: "",
        fileUrl: "",
        fileType: "",
        downloads: 0,
        shareCount: 0,
        rating: 0,
        isTrending: false,
        createdAt: new Date(0),
    });
    const preferredLevel = LEVEL_INDEX.find(({ level }) =>
        resource.category.toLowerCase().includes(level.toLowerCase()),
    );
    const levelsToSearch = preferredLevel
        ? [preferredLevel, ...LEVEL_INDEX.filter(({ level }) => level !== preferredLevel.level)]
        : LEVEL_INDEX;

    let matchedLevel: string | null = null;
    let matchedSubject: string | null = null;
    let matchedChapter: string | null = null;

    for (const { level, content } of levelsToSearch) {
        const levelHit = searchText.includes(level.toLowerCase());
        for (const subject of content.subjects) {
            const subjectTerms = [subject.name, subject.dbMatch].map((term) => term.toLowerCase());
            const subjectHit = subjectTerms.some((term) => searchText.includes(term));

            if (levelHit && !matchedLevel) {
                matchedLevel = level;
            }

            if (!matchedSubject && subjectHit) {
                matchedSubject = subject.name;
                if (!matchedLevel) {
                    matchedLevel = level;
                }
            }

            if (!matchedChapter) {
                const chapterHit = subject.chapters.find((chapter) =>
                    searchText.includes(chapter.toLowerCase()),
                );
                if (chapterHit) {
                    matchedChapter = chapterHit;
                    matchedSubject = matchedSubject ?? subject.name;
                    matchedLevel = matchedLevel ?? level;
                }
            }
        }
    }

    return {
        level: matchedLevel,
        subject: matchedSubject,
        chapter: matchedChapter,
        searchText,
    };
}

export function calculatePublicResourceRank(
    resource: PublicResourceRecord,
    filters: PublicResourceFilters,
    metadata: InferredResourceMetadata,
    now = new Date(),
) {
    const normalizedCategory = normalizeOptionalFilter(filters.category);
    const normalizedSubType = normalizeOptionalFilter(filters.subType);
    const normalizedSearch = filters.search?.trim().toLowerCase() ?? "";
    const searchTokens = tokenizeSearch(filters.search);

    let score = 0;
    let matchesSearch = searchTokens.length === 0;

    if (normalizedCategory && resource.category.toLowerCase() === normalizedCategory.toLowerCase()) {
        score += 12;
    }

    if (normalizedSubType && resource.subType.toLowerCase() === normalizedSubType.toLowerCase()) {
        score += 12;
    }

    if (filters.isTrending && resource.isTrending) {
        score += 10;
    }

    if (normalizedSearch) {
        const titleText = resource.title.toLowerCase();
        const descriptionText = (resource.description ?? "").toLowerCase();
        const authorText = (resource.uploadedBy?.fullName ?? "").toLowerCase();
        const subjectText = (metadata.subject ?? "").toLowerCase();
        const chapterText = (metadata.chapter ?? "").toLowerCase();
        const exactTitleHit = titleText.includes(normalizedSearch);
        const exactMetadataHit = subjectText.includes(normalizedSearch) || chapterText.includes(normalizedSearch);

        if (exactTitleHit) score += 35;
        if (exactMetadataHit) score += 20;

        let tokenHits = 0;
        for (const token of searchTokens) {
            let tokenMatched = false;
            if (titleText.includes(token)) {
                score += 12;
                tokenMatched = true;
            }
            if (descriptionText.includes(token)) {
                score += 6;
                tokenMatched = true;
            }
            if (authorText.includes(token)) {
                score += 5;
                tokenMatched = true;
            }
            if (subjectText.includes(token)) {
                score += 8;
                tokenMatched = true;
            }
            if (chapterText.includes(token)) {
                score += 7;
                tokenMatched = true;
            }

            if (tokenMatched) {
                tokenHits += 1;
            }
        }

        matchesSearch = tokenHits === searchTokens.length || exactTitleHit || exactMetadataHit;
    }

    score += Math.min(Math.log10(resource.downloads + 1) * 8, 18);
    score += Math.min(Math.log10(resource.shareCount + 1) * 6, 12);
    score += Math.min(resource.rating * 2, 10);
    score += resource.isTrending ? 16 : 0;
    score += resource.providerType === "ICAI" ? 5 : resource.providerType === "TEACHER" ? 3 : 0;

    const ageDays = Math.max(0, Math.ceil((now.getTime() - resource.createdAt.getTime()) / 86_400_000));
    score += Math.max(0, 12 - Math.min(ageDays, 12));

    return { score: Math.round(score), matchesSearch };
}

function formatPublicResource(resource: PublicResourceRecord): PublicResource {
    return {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        fileUrl: resource.fileUrl,
        fileType: resource.fileType,
        category: resource.category,
        subType: resource.subType,
        providerType: resource.providerType,
        downloads: resource.downloads,
        shareCount: resource.shareCount,
        rating: resource.rating,
        isTrending: resource.isTrending,
        author: resource.uploadedBy?.fullName || "Anonymous",
        authorId: resource.uploadedBy?.id || null,
        createdAt: resource.createdAt,
        specialty: resource.uploadedBy?.expertise || resource.uploadedBy?.designation || "Expert",
        date: new Date(resource.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }),
    };
}

export function buildPublicResourceCatalog(
    resources: PublicResourceRecord[],
    filters: PublicResourceFilters,
    now = new Date(),
) {
    return resources
        .map((resource) => {
            const metadata = inferPublicResourceMetadata(resource);
            const ranking = calculatePublicResourceRank(resource, filters, metadata, now);
            return { resource, ranking };
        })
        .filter((entry) => entry.ranking.matchesSearch)
        .sort((left, right) => {
            if (right.ranking.score !== left.ranking.score) {
                return right.ranking.score - left.ranking.score;
            }
            return right.resource.createdAt.getTime() - left.resource.createdAt.getTime();
        })
        .slice(0, 200)
        .map((entry) => formatPublicResource(entry.resource));
}

export function buildPublicResourceCatalogInsight(resources: PublicResourceRecord[]): PublicResourceCatalogInsight {
    const subTypeCounts = new Map<string, number>();
    const subjectCounts = new Map<string, number>();
    const chapterCounts = new Map<string, number>();
    const categories = new Set<string>();

    for (const resource of resources) {
        categories.add(resource.category);
        subTypeCounts.set(resource.subType, (subTypeCounts.get(resource.subType) ?? 0) + 1);

        const metadata = inferPublicResourceMetadata(resource);
        if (metadata.subject) {
            subjectCounts.set(metadata.subject, (subjectCounts.get(metadata.subject) ?? 0) + 1);
        }
        if (metadata.chapter) {
            chapterCounts.set(metadata.chapter, (chapterCounts.get(metadata.chapter) ?? 0) + 1);
        }
    }

    return {
        totalResources: resources.length,
        trendingResources: resources.filter((resource) => resource.isTrending).length,
        categories: Array.from(categories).sort(),
        topSubTypes: Array.from(subTypeCounts.entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count })),
        topSubjects: Array.from(subjectCounts.entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([subject]) => subject),
        highlightedChapters: Array.from(chapterCounts.entries())
            .sort((left, right) => right[1] - left[1])
            .slice(0, 5)
            .map(([chapter]) => chapter),
    };
}

async function getPublicResourceRecords(filters: PublicResourceFilters): Promise<PublicResourceRecord[]> {
    const normalizedCategory = normalizeOptionalFilter(filters.category);
    const normalizedSubType = normalizeOptionalFilter(filters.subType);

    return prisma.studyMaterial.findMany({
        where: {
            isPublic: true,
            ...(normalizedCategory ? { category: normalizedCategory } : {}),
            ...(normalizedSubType ? { subType: normalizedSubType } : {}),
            ...(filters.isTrending ? { isTrending: true } : {}),
        },
        include: {
            uploadedBy: {
                select: {
                    id: true,
                    fullName: true,
                    designation: true,
                    expertise: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 300,
    });
}

export async function listPublicResources(filters: PublicResourceFilters) {
    return buildPublicResourceCatalog(await getPublicResourceRecords(filters), filters);
}

export async function getPublicResourceCatalogInsights(filters: PublicResourceFilters) {
    return buildPublicResourceCatalogInsight(await getPublicResourceRecords(filters));
}
