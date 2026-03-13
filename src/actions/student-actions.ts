"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import prisma from "@/lib/prisma/client";

// ── Types ────────────────────────────────────────────────────────────────────

export type HistoryAttempt = {
    id: string;
    examId: string;
    seriesTitle: string;
    subject: string;
    category: string;
    attemptedAt: string; // ISO date string
    durationUsedMinutes: number;
    totalDurationMinutes: number;
    correct: number;
    total: number;
    accuracy: number;
    xpEarned: number;
    status: "completed" | "in-progress" | "abandoned";
    topicBreakdown: { topic: string; accuracy: number; correct: number; total: number }[];
    weakTopics: string[];
};

export type StudentHistoryData = {
    profile: {
        name: string;
        caLevel: string;
        level: number;
        totalXP: number;
        xpToNextLevel: number;
        streak: number;
        longestStreak: number;
        totalAttempts: number;
        totalCorrect: number;
        totalQuestions: number;
        avgAccuracy: number;
        joinedDaysAgo: number;
        badges: string[];
    };
    subjectAccuracy: { subject: string; accuracy: number; attempts: number }[];
    attempts: HistoryAttempt[];
};

// ── Main server action ───────────────────────────────────────────────────────

export async function getStudentHistory(): Promise<{ success: boolean; data?: StudentHistoryData; error?: string }> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);

        // 1. Learning profile
        const learningProfile = await prisma.studentLearningProfile.findUnique({
            where: { studentId: user.id },
        });

        const joinedDaysAgo = Math.floor(
            (Date.now() - new Date(user.createdAt).getTime()) / 86_400_000
        );

        const xpToNextLevel = (learningProfile?.level ?? 1) * 100;

        const profile = {
            name: user.fullName ?? user.email ?? "Student",
            caLevel: user.examTarget ?? "CA Final",
            level: learningProfile?.level ?? 1,
            totalXP: learningProfile?.totalXP ?? 0,
            xpToNextLevel,
            streak: learningProfile?.streak ?? 0,
            longestStreak: learningProfile?.longestStreak ?? 0,
            totalAttempts: learningProfile?.totalAttempts ?? 0,
            totalCorrect: learningProfile?.totalCorrect ?? 0,
            totalQuestions: learningProfile
                ? Math.round(learningProfile.totalCorrect / Math.max(learningProfile.avgAccuracy, 0.0001))
                : 0,
            avgAccuracy: Math.round((learningProfile?.avgAccuracy ?? 0) * 100),
            joinedDaysAgo,
            badges: learningProfile?.badgesJson
                ? (() => { try { return JSON.parse(learningProfile.badgesJson) as string[]; } catch { return []; } })()
                : [],
        };

        // 2. Topic progress → subject accuracy heatmap
        const topicProgress = await prisma.topicProgress.findMany({
            where: { studentId: user.id },
            select: { subject: true, accuracy: true, totalAttempted: true },
        });

        // Group by subject
        const subjectMap = new Map<string, { totalCorrect: number; totalAttempted: number; attempts: number }>();
        for (const tp of topicProgress) {
            const existing = subjectMap.get(tp.subject) ?? { totalCorrect: 0, totalAttempted: 0, attempts: 0 };
            subjectMap.set(tp.subject, {
                totalCorrect: existing.totalCorrect + tp.accuracy * tp.totalAttempted,
                totalAttempted: existing.totalAttempted + tp.totalAttempted,
                attempts: existing.attempts + 1,
            });
        }

        const subjectAccuracy = Array.from(subjectMap.entries()).map(([subject, data]) => ({
            subject,
            accuracy: Math.round((data.totalCorrect / Math.max(data.totalAttempted, 1)) * 100),
            attempts: data.attempts,
        })).sort((a, b) => b.attempts - a.attempts);

        // 3. Exam attempts history
        const rawAttempts = await prisma.examAttempt.findMany({
            where: { studentId: user.id },
            include: {
                exam: {
                    select: { title: true, category: true, duration: true, totalMarks: true },
                },
                answers: {
                    include: {
                        question: { select: { topic: true, subject: true } },
                    },
                },
            },
            orderBy: { startTime: "desc" },
            take: 50,
        });

        const attempts: HistoryAttempt[] = rawAttempts.map((a) => {
            const total = a.exam.totalMarks;
            const correct = Math.round(a.score);
            const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

            // Build per-topic breakdown from answers
            const topicMap = new Map<string, { correct: number; total: number }>();
            for (const ans of a.answers) {
                const topic = ans.question.topic ?? "General";
                const existing = topicMap.get(topic) ?? { correct: 0, total: 0 };
                topicMap.set(topic, {
                    correct: existing.correct + (ans.isCorrect ? 1 : 0),
                    total: existing.total + 1,
                });
            }

            const topicBreakdown = Array.from(topicMap.entries()).map(([topic, d]) => ({
                topic,
                accuracy: Math.round((d.correct / d.total) * 100),
                correct: d.correct,
                total: d.total,
            }));

            const weakTopics = topicBreakdown.filter((t) => t.accuracy < 60).map((t) => t.topic);

            // Duration used: seconds between start and end (or estimate)
            const endTime = a.endTime ?? new Date();
            const durationUsedMinutes = Math.round((endTime.getTime() - a.startTime.getTime()) / 60_000);

            // XP estimate per session: 5 × correct + accuracy bonus
            const xpEarned = correct * 5 + (accuracy >= 80 ? 20 : 0);

            // Status
            const status: "completed" | "in-progress" | "abandoned" =
                a.status === "SUBMITTED" ? "completed"
                    : a.status === "STARTED" ? "in-progress"
                        : "abandoned";

            return {
                id: a.id,
                examId: a.examId,
                seriesTitle: a.exam.title,
                subject: a.exam.category,
                category: a.exam.category,
                attemptedAt: a.startTime.toISOString().split("T")[0],
                durationUsedMinutes: Math.max(1, durationUsedMinutes),
                totalDurationMinutes: a.exam.duration,
                correct,
                total,
                accuracy,
                xpEarned,
                status,
                topicBreakdown,
                weakTopics,
            };
        });

        return {
            success: true,
            data: { profile, subjectAccuracy, attempts },
        };
    } catch (err) {
        console.error("getStudentHistory error:", err);
        return { success: false, error: err instanceof Error ? err.message : "Failed to fetch history." };
    }
}

// ── Fix startExamAttempt to use session auth ──────────────────────────────────
// This replaces the unsafe "caller passes any studentId" pattern.
// Called from the war-room page — uses session to get real studentId.

export async function startMyExamAttempt(examId: string) {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);

        // Check for existing active attempt
        const existing = await prisma.examAttempt.findFirst({
            where: { examId, studentId: user.id, status: "STARTED" },
        });
        if (existing) return { success: true, attemptId: existing.id, studentId: user.id };

        const attempt = await prisma.examAttempt.create({
            data: { examId, studentId: user.id, status: "STARTED", startTime: new Date() },
        });

        return { success: true, attemptId: attempt.id, studentId: user.id };
    } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Failed to start attempt." };
    }
}
