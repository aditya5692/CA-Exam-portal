"use server";

import prisma from "@/lib/prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

export type SearchResultType = "TEACHER" | "STUDENT" | "EXAM" | "MATERIAL" | "BATCH";

export interface SearchResult {
    id: string;
    title: string;
    subtitle?: string;
    type: SearchResultType;
    href: string;
    metadata?: any;
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
        const results: SearchResult[] = [];

        if (user.role === "STUDENT" || user.role === "ADMIN") {
            // 1. Search Teachers
            const teachers = await prisma.user.findMany({
                where: {
                    role: "TEACHER",
                    isPublicProfile: true,
                    OR: [
                        { fullName: { contains: searchTerm } },
                        { expertise: { contains: searchTerm } },
                        { designation: { contains: searchTerm } },
                    ],
                },
                take: 5,
                select: { id: true, fullName: true, designation: true, expertise: true },
            });

            teachers.forEach((t) => {
                results.push({
                    id: t.id,
                    title: t.fullName || "Unnamed Teacher",
                    subtitle: t.designation || t.expertise || "Faculty",
                    type: "TEACHER",
                    href: `/student/teachers/${t.id}`,
                });
            });

            // 2. Search Exams
            const exams = await prisma.exam.findMany({
                where: {
                    status: "PUBLISHED",
                    OR: [
                        { title: { contains: searchTerm } },
                        { subject: { contains: searchTerm } },
                    ],
                },
                take: 5,
                select: { id: true, title: true, subject: true, category: true },
            });

            exams.forEach((e) => {
                results.push({
                    id: e.id,
                    title: e.title,
                    subtitle: `${e.category}${e.subject ? ` • ${e.subject}` : ""}`,
                    type: "EXAM",
                    href: `/exam/${e.id}`,
                });
            });

            // 3. Search Materials (Public)
            const materials = await prisma.studyMaterial.findMany({
                where: {
                    isPublic: true,
                    OR: [
                        { title: { contains: searchTerm } },
                        { description: { contains: searchTerm } },
                        { category: { contains: searchTerm } },
                    ],
                },
                take: 5,
                select: { id: true, title: true, category: true, subType: true },
            });

            materials.forEach((m) => {
                results.push({
                    id: m.id,
                    title: m.title,
                    subtitle: `${m.category} • ${m.subType}`,
                    type: "MATERIAL",
                    href: `/student/free-resources?search=${encodeURIComponent(searchTerm)}`, 
                });
            });
        }

        if (user.role === "TEACHER" || user.role === "ADMIN") {
            // 1. Search Students
            const students = await prisma.user.findMany({
                where: {
                    role: "STUDENT",
                    OR: [
                        { fullName: { contains: searchTerm } },
                        { registrationNumber: { contains: searchTerm } },
                        { phone: { contains: searchTerm } },
                    ],
                },
                take: 10,
                select: { id: true, fullName: true, registrationNumber: true, email: true },
            });

            students.forEach((s) => {
                results.push({
                    id: s.id,
                    title: s.fullName || "Unnamed Student",
                    subtitle: s.registrationNumber || s.email || "Student",
                    type: "STUDENT",
                    href: `/teacher/students?id=${s.id}&name=${encodeURIComponent(s.fullName || "Student")}`,
                });
            });

            // 2. Search Teacher's Batches
            const batches = await prisma.batch.findMany({
                where: {
                    teacherId: user.id,
                    OR: [
                        { name: { contains: searchTerm } },
                        { uniqueJoinCode: { contains: searchTerm } },
                    ],
                },
                take: 5,
                select: { id: true, name: true, uniqueJoinCode: true },
            });

            batches.forEach((b) => {
                results.push({
                    id: b.id,
                    title: b.name,
                    subtitle: `Code: ${b.uniqueJoinCode}`,
                    type: "BATCH",
                    href: `/teacher/batches/${b.id}`,
                });
            });

            // 3. Search Teacher's Materials
            const myMaterials = await prisma.studyMaterial.findMany({
                where: {
                    uploadedById: user.id,
                    title: { contains: searchTerm },
                },
                take: 5,
                select: { id: true, title: true, category: true },
            });

            myMaterials.forEach((m) => {
                results.push({
                    id: m.id,
                    title: m.title,
                    subtitle: `My Material • ${m.category}`,
                    type: "MATERIAL",
                    href: `/teacher/materials/${m.id}`,
                });
            });
        }

        return { success: true, data: results };
    } catch (error) {
        console.error("Global search error:", error);
        return { success: false, data: [], message: "Internal server error" };
    }
}
