"use server";

import { getCurrentUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

export type SearchResultType = "TEACHER" | "STUDENT" | "EXAM" | "MATERIAL" | "BATCH";

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: SearchResultType;
    href: string;
    metadata?: Record<string, unknown>;
}

type RankedSearchResult = SearchResult & {
    score: number;
};

function normalizeText(value: string | null | undefined) {
    return value?.trim().toLowerCase() ?? "";
}

function tokenizeQuery(query: string) {
    return query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
}

function scoreFieldMatch(value: string | null | undefined, query: string, tokens: string[], weight: number) {
    const normalizedValue = normalizeText(value);
    if (!normalizedValue) {
        return 0;
    }

    let score = 0;
    if (normalizedValue === query) {
        score += weight * 8;
    } else if (normalizedValue.startsWith(query)) {
        score += weight * 5;
    } else if (normalizedValue.includes(query)) {
        score += weight * 3;
    }

    for (const token of tokens) {
        if (normalizedValue.includes(token)) {
            score += weight;
        }
    }

    return score;
}

function rankResult(
    results: RankedSearchResult[],
    result: SearchResult,
    query: string,
    tokens: string[],
    fields: Array<{ value: string | null | undefined; weight: number }>,
) {
    const score = fields.reduce((total, field) => total + scoreFieldMatch(field.value, query, tokens, field.weight), 0);
    if (score <= 0) {
        return;
    }

    results.push({
        ...result,
        score,
        metadata: {
            ...(result.metadata ?? {}),
            score,
        },
    });
}

function finalizeResults(results: RankedSearchResult[]) {
    const deduped = new Map<string, RankedSearchResult>();

    for (const result of results) {
        const key = `${result.type}:${result.id}`;
        const existing = deduped.get(key);
        if (!existing || existing.score < result.score) {
            deduped.set(key, result);
        }
    }

    return Array.from(deduped.values())
        .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
        .slice(0, 14)
        .map((result) => {
            const { score, ...searchResult } = result;
            void score;
            return searchResult;
        });
}

function buildMaterialHref(role: string, title: string) {
    if (role === "TEACHER") {
        return `/teacher/free-resources?search=${encodeURIComponent(title)}`;
    }

    return `/student/free-resources?search=${encodeURIComponent(title)}`;
}

export async function performGlobalSearch(query: string): Promise<{ success: boolean; data: SearchResult[]; message?: string }> {
    try {
        if (!query || query.trim().length < 2) {
            return { success: true, data: [] };
        }

        const user = await getCurrentUser(["STUDENT", "TEACHER", "ADMIN"]);
        if (!user) {
            return { success: false, data: [], message: "Unauthorized" };
        }

        const searchTerm = query.trim();
        const normalizedQuery = searchTerm.toLowerCase();
        const tokens = tokenizeQuery(searchTerm);
        const results: RankedSearchResult[] = [];

        if (user.role === "STUDENT" || user.role === "ADMIN") {
            const [teachers, exams, materials, batches] = await Promise.all([
                prisma.user.findMany({
                    where: {
                        role: "TEACHER",
                        isPublicProfile: true,
                        OR: [
                            { fullName: { contains: searchTerm } },
                            { email: { contains: searchTerm } },
                            { expertise: { contains: searchTerm } },
                            { designation: { contains: searchTerm } },
                            { department: { contains: searchTerm } },
                        ],
                    },
                    take: 12,
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        designation: true,
                        expertise: true,
                        department: true,
                    },
                }),
                prisma.exam.findMany({
                    where: {
                        status: "PUBLISHED",
                        OR: [
                            { title: { contains: searchTerm } },
                            { description: { contains: searchTerm } },
                            { subject: { contains: searchTerm } },
                            { chapter: { contains: searchTerm } },
                            { category: { contains: searchTerm } },
                            { examType: { contains: searchTerm } },
                            { teacher: { is: { fullName: { contains: searchTerm } } } },
                        ],
                    },
                    take: 12,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        subject: true,
                        chapter: true,
                        category: true,
                        examType: true,
                        teacher: { select: { fullName: true } },
                    },
                }),
                prisma.studyMaterial.findMany({
                    where: {
                        isPublic: true,
                        OR: [
                            { title: { contains: searchTerm } },
                            { description: { contains: searchTerm } },
                            { category: { contains: searchTerm } },
                            { subType: { contains: searchTerm } },
                            { providerType: { contains: searchTerm } },
                            { uploadedBy: { is: { fullName: { contains: searchTerm } } } },
                        ],
                    },
                    take: 12,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        subType: true,
                        providerType: true,
                        uploadedBy: { select: { fullName: true } },
                    },
                }),
                prisma.batch.findMany({
                    where: user.role === "STUDENT"
                        ? {
                            enrollments: { some: { studentId: user.id } },
                            OR: [
                                { name: { contains: searchTerm } },
                                { uniqueJoinCode: { contains: searchTerm } },
                                { teacher: { is: { fullName: { contains: searchTerm } } } },
                            ],
                        }
                        : {
                            OR: [
                                { name: { contains: searchTerm } },
                                { uniqueJoinCode: { contains: searchTerm } },
                                { teacher: { is: { fullName: { contains: searchTerm } } } },
                            ],
                        },
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        uniqueJoinCode: true,
                        teacher: { select: { fullName: true } },
                    },
                }),
            ]);

            teachers.forEach((teacher) => {
                rankResult(results, {
                    id: teacher.id,
                    title: teacher.fullName || "Unnamed Teacher",
                    subtitle: [teacher.designation, teacher.expertise, teacher.department].filter(Boolean).join(" • ") || teacher.email || "Faculty",
                    type: "TEACHER",
                    href: `/student/teachers/${teacher.id}`,
                }, normalizedQuery, tokens, [
                    { value: teacher.fullName, weight: 5 },
                    { value: teacher.expertise, weight: 4 },
                    { value: teacher.designation, weight: 3 },
                    { value: teacher.department, weight: 2 },
                    { value: teacher.email, weight: 2 },
                ]);
            });

            exams.forEach((exam) => {
                rankResult(results, {
                    id: exam.id,
                    title: exam.title,
                    subtitle: [exam.category, exam.subject, exam.chapter, exam.teacher.fullName].filter(Boolean).join(" • "),
                    type: "EXAM",
                    href: `/exam/${exam.id}`,
                }, normalizedQuery, tokens, [
                    { value: exam.title, weight: 5 },
                    { value: exam.subject, weight: 4 },
                    { value: exam.chapter, weight: 3 },
                    { value: exam.category, weight: 2 },
                    { value: exam.examType, weight: 2 },
                    { value: exam.description, weight: 2 },
                    { value: exam.teacher.fullName, weight: 2 },
                ]);
            });

            materials.forEach((material) => {
                rankResult(results, {
                    id: material.id,
                    title: material.title,
                    subtitle: [material.category, material.subType, material.uploadedBy.fullName].filter(Boolean).join(" • "),
                    type: "MATERIAL",
                    href: buildMaterialHref(user.role, material.title),
                }, normalizedQuery, tokens, [
                    { value: material.title, weight: 5 },
                    { value: material.description, weight: 3 },
                    { value: material.category, weight: 3 },
                    { value: material.subType, weight: 2 },
                    { value: material.providerType, weight: 2 },
                    { value: material.uploadedBy.fullName, weight: 2 },
                ]);
            });

            batches.forEach((batch) => {
                rankResult(results, {
                    id: batch.id,
                    title: batch.name,
                    subtitle: [batch.teacher.fullName, `Code ${batch.uniqueJoinCode}`].filter(Boolean).join(" • "),
                    type: "BATCH",
                    href: `/teacher/batches/${batch.id}`,
                }, normalizedQuery, tokens, [
                    { value: batch.name, weight: 5 },
                    { value: batch.uniqueJoinCode, weight: 4 },
                    { value: batch.teacher.fullName, weight: 2 },
                ]);
            });
        }

        if (user.role === "TEACHER" || user.role === "ADMIN") {
            const [students, batches, materials, exams] = await Promise.all([
                prisma.user.findMany({
                    where: {
                        role: "STUDENT",
                        OR: [
                            { fullName: { contains: searchTerm } },
                            { registrationNumber: { contains: searchTerm } },
                            { phone: { contains: searchTerm } },
                            { email: { contains: searchTerm } },
                            { department: { contains: searchTerm } },
                            { enrollments: { some: { batch: { name: { contains: searchTerm } } } } },
                        ],
                    },
                    take: 12,
                    select: {
                        id: true,
                        fullName: true,
                        registrationNumber: true,
                        email: true,
                        phone: true,
                        department: true,
                        enrollments: {
                            select: {
                                batch: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                            take: 3,
                        },
                    },
                }),
                prisma.batch.findMany({
                    where: user.role === "TEACHER"
                        ? {
                            teacherId: user.id,
                            OR: [
                                { name: { contains: searchTerm } },
                                { uniqueJoinCode: { contains: searchTerm } },
                            ],
                        }
                        : {
                            OR: [
                                { name: { contains: searchTerm } },
                                { uniqueJoinCode: { contains: searchTerm } },
                                { teacher: { is: { fullName: { contains: searchTerm } } } },
                            ],
                        },
                    take: 10,
                    select: {
                        id: true,
                        name: true,
                        uniqueJoinCode: true,
                        teacher: { select: { fullName: true } },
                    },
                }),
                prisma.studyMaterial.findMany({
                    where: user.role === "TEACHER"
                        ? {
                            uploadedById: user.id,
                            OR: [
                                { title: { contains: searchTerm } },
                                { description: { contains: searchTerm } },
                                { category: { contains: searchTerm } },
                                { subType: { contains: searchTerm } },
                                { providerType: { contains: searchTerm } },
                            ],
                        }
                        : {
                            OR: [
                                { title: { contains: searchTerm } },
                                { description: { contains: searchTerm } },
                                { category: { contains: searchTerm } },
                                { subType: { contains: searchTerm } },
                                { providerType: { contains: searchTerm } },
                                { uploadedBy: { is: { fullName: { contains: searchTerm } } } },
                            ],
                        },
                    take: 12,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        category: true,
                        subType: true,
                        providerType: true,
                        uploadedBy: { select: { fullName: true } },
                    },
                }),
                prisma.exam.findMany({
                    where: user.role === "TEACHER"
                        ? {
                            teacherId: user.id,
                            OR: [
                                { title: { contains: searchTerm } },
                                { description: { contains: searchTerm } },
                                { subject: { contains: searchTerm } },
                                { chapter: { contains: searchTerm } },
                                { category: { contains: searchTerm } },
                            ],
                        }
                        : {
                            OR: [
                                { title: { contains: searchTerm } },
                                { description: { contains: searchTerm } },
                                { subject: { contains: searchTerm } },
                                { chapter: { contains: searchTerm } },
                                { category: { contains: searchTerm } },
                                { teacher: { is: { fullName: { contains: searchTerm } } } },
                            ],
                        },
                    take: 12,
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        subject: true,
                        chapter: true,
                        category: true,
                        status: true,
                        teacher: { select: { fullName: true } },
                    },
                }),
            ]);

            students.forEach((student) => {
                rankResult(results, {
                    id: student.id,
                    title: student.fullName || "Unnamed Student",
                    subtitle: [
                        student.registrationNumber,
                        student.email,
                        student.enrollments.map((enrollment) => enrollment.batch.name).join(", "),
                    ].filter(Boolean).join(" • "),
                    type: "STUDENT",
                    href: `/teacher/students?id=${student.id}&name=${encodeURIComponent(student.fullName || "Student")}`,
                }, normalizedQuery, tokens, [
                    { value: student.fullName, weight: 5 },
                    { value: student.registrationNumber, weight: 4 },
                    { value: student.email, weight: 3 },
                    { value: student.phone, weight: 3 },
                    { value: student.department, weight: 2 },
                    { value: student.enrollments.map((enrollment) => enrollment.batch.name).join(" "), weight: 2 },
                ]);
            });

            batches.forEach((batch) => {
                rankResult(results, {
                    id: batch.id,
                    title: batch.name,
                    subtitle: [batch.teacher.fullName, `Code ${batch.uniqueJoinCode}`].filter(Boolean).join(" • "),
                    type: "BATCH",
                    href: `/teacher/batches/${batch.id}`,
                }, normalizedQuery, tokens, [
                    { value: batch.name, weight: 5 },
                    { value: batch.uniqueJoinCode, weight: 4 },
                    { value: batch.teacher.fullName, weight: 2 },
                ]);
            });

            materials.forEach((material) => {
                rankResult(results, {
                    id: material.id,
                    title: material.title,
                    subtitle: [material.category, material.subType, material.uploadedBy.fullName].filter(Boolean).join(" • "),
                    type: "MATERIAL",
                    href: buildMaterialHref(user.role, material.title),
                }, normalizedQuery, tokens, [
                    { value: material.title, weight: 5 },
                    { value: material.description, weight: 3 },
                    { value: material.category, weight: 3 },
                    { value: material.subType, weight: 2 },
                    { value: material.providerType, weight: 2 },
                    { value: material.uploadedBy.fullName, weight: 2 },
                ]);
            });

            exams.forEach((exam) => {
                rankResult(results, {
                    id: exam.id,
                    title: exam.title,
                    subtitle: [exam.status, exam.subject, exam.chapter, exam.teacher.fullName].filter(Boolean).join(" • "),
                    type: "EXAM",
                    href: `/exam/${exam.id}`,
                }, normalizedQuery, tokens, [
                    { value: exam.title, weight: 5 },
                    { value: exam.description, weight: 3 },
                    { value: exam.subject, weight: 3 },
                    { value: exam.chapter, weight: 2 },
                    { value: exam.category, weight: 2 },
                    { value: exam.teacher.fullName, weight: 2 },
                ]);
            });
        }

        return { success: true, data: finalizeResults(results) };
    } catch (error) {
        console.error("Global search error:", error);
        return { success: false, data: [], message: "Internal server error" };
    }
}
