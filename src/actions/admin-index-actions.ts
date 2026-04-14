"use server";

import { requireAuth } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";
import type { AdminMetricsData } from "@/types/admin";
import { ActionResponse } from "@/types/shared";

/**
 * Fetches platform-wide metrics for the admin control center.
 */
export async function getAdminMetrics(): Promise<ActionResponse<AdminMetricsData>> {
    try {
        await requireAuth("ADMIN");

        const [
            studentCount,
            teacherCount,
            batchCount,
            examCount,
            mcqCount,
            materialCount,
            totalDownloads,
            totalAttempts,
            recentUsers,
            recentSubscriptions
        ] = await Promise.all([
            prisma.user.count({ where: { role: "STUDENT" } }),
            prisma.user.count({ where: { role: "TEACHER" } }),
            prisma.batch.count(),
            prisma.exam.count(),
            prisma.question.count(),
            prisma.studyMaterial.count(),
            prisma.studyMaterial.aggregate({ _sum: { downloads: true } }),
            prisma.examAttempt.count(),
            prisma.user.findMany({
                orderBy: { createdAt: 'desc' },
                take: 5,
                select: { id: true, fullName: true, email: true, createdAt: true, role: true }
            }),
            prisma.subscription.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { fullName: true, email: true } }
                }
            })
        ]);

        return {
            success: true,
            data: {
                metrics: {
                    students: studentCount,
                    teachers: teacherCount,
                    batches: batchCount,
                    exams: examCount,
                    mcqs: mcqCount,
                    resources: materialCount,
                    downloads: totalDownloads._sum.downloads ?? 0,
                    attempts: totalAttempts,
                },
                recentUsers,
                recentSubscriptions: recentSubscriptions.map(s => ({
                    id: s.id,
                    planName: s.plan,
                    userName: s.user.fullName || "User",
                    amount: s.amountPaise / 100, // Convert paise to major unit if needed, or keep as is if amount is paise
                    status: s.status,
                    createdAt: s.createdAt
                })),
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error("getAdminMetrics error:", error);
        return { success: false, message: "Failed to fetch administrative metrics." };
    }
}
