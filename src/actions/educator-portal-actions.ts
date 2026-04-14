"use server";

import prisma from "@/lib/prisma/client";
import { getStudentFeed } from "./batch-actions";
import { getStudentSharedMaterials } from "./student-actions";
import { getExamHubData } from "./student-actions";

export async function getEducatorPortalData(teacherId: string) {
    try {
        const teacher = await prisma.user.findFirst({
            where: { id: teacherId, role: "TEACHER" },
            select: { id: true, fullName: true, email: true }
        });
        
        if (!teacher) return { success: false, message: "Educator not found" };

        const [feedRes, materialsRes, examHubRes] = await Promise.all([
            getStudentFeed(),
            getStudentSharedMaterials(),
            getExamHubData()
        ]);

        const teacherDisplayName = teacher.fullName || teacher.email || "Teacher";

        const feedItems = (feedRes.data?.feedItems ?? []).filter(item => item.teacherName === teacherDisplayName || item.teacherName === teacher.fullName);
        const materials = (materialsRes.data?.materials ?? []).filter((m: any) => m.uploadedById === teacherId);
        const mockTests = (examHubRes.data?.mockTests ?? []).filter(t => t.teacherName === teacherDisplayName || t.teacherName === teacher.fullName);

        return {
            success: true,
            data: {
                teacher: {
                    id: teacher.id,
                    name: teacherDisplayName,
                    email: teacher.email
                },
                feedItems,
                materials,
                mockTests
            }
        };
    } catch (error: any) {
        console.error("Failed to fetch educator portal data:", error);
        return { success: false, message: error?.message || "Internal server error" };
    }
}
