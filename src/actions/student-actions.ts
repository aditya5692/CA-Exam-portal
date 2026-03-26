"use server";

import { getCurrentUserOrDemoUser } from "@/lib/auth/session";
import { CA_FINAL_CONTENT,CA_FOUNDATION_CONTENT,CA_INTER_CONTENT } from "@/lib/constants/chapters";
import prisma from "@/lib/prisma/client";
import {
  getActionErrorMessage,
  isUniqueConstraintError,
  readJsonStringArray,
  withSerializableTransaction,
} from "@/lib/server/action-utils";
import { startExamAttemptRecord } from "@/lib/server/exam-workflow";
import { getStudentStudyRecommendations } from "@/lib/server/study-intelligence";
import { buildStudentVisibleExamWhere } from "@/lib/server/exam-publishing";
import { buildStudentExamTargetLabel,resolveStudentExamTarget } from "@/lib/student-level";
import { getUserRank } from "./leaderboard-actions";
import { ActionResponse,UnifiedExam,UnifiedMaterial } from "@/types/shared";
import type { ExamHubData,StudentAttempt,StudentHistoryData } from "@/types/student";
import { revalidatePath } from "next/cache";

// ── Types ────────────────────────────────────────────────────────────────────

// ── Main server action ───────────────────────────────────────────────────────

/**
 * Fetches comprehensive history and progress for the current student.
 */
export async function getStudentHistory(): Promise<ActionResponse<StudentHistoryData>> {
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
        const examTarget = resolveStudentExamTarget(user);

        const profile = {
            name: user.fullName ?? user.email ?? "Student",
            caLevel: examTarget.caLevelLabel,
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
            badges: readJsonStringArray(learningProfile?.badgesJson),
            rank: 0,
            percentile: 0,
        };

        const rankRes = await getUserRank(user.id);
        if (rankRes.success) {
            profile.rank = rankRes.data.rank;
            profile.percentile = rankRes.data.percentile;
        }

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
            where: { studentId: user.id, attemptMode: "MOCK" },
            include: {
                exam: {
                    select: { title: true, category: true, subject: true, duration: true, totalMarks: true },
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

        const attempts: StudentAttempt[] = rawAttempts.map((a) => {
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
                subject: a.exam.subject || a.exam.category,
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

        // 4. Performance Trend (Last 6 Months)
        const trendMap = new Map<string, { total: number; count: number }>();
        const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return d.toLocaleString('default', { month: 'short' });
        }).reverse();

        for (const month of last6Months) trendMap.set(month, { total: 0, count: 0 });

        for (const a of attempts) {
            const date = new Date(a.attemptedAt);
            const month = date.toLocaleString('default', { month: 'short' });
            if (trendMap.has(month)) {
                const existing = trendMap.get(month)!;
                trendMap.set(month, { total: existing.total + a.accuracy, count: existing.count + 1 });
            }
        }

        const performanceTrend = last6Months.map(month => ({
            date: month,
            score: trendMap.get(month)!.count > 0 
                ? Math.round(trendMap.get(month)!.total / trendMap.get(month)!.count) 
                : 0
        }));

        const studyRecommendations = await getStudentStudyRecommendations(user.id, 5);

        // 5. Comparative Analysis (real cohort benchmark derived from learning profiles)
        const myAvg = profile.avgAccuracy;
        const comparativeAnalysis = [
            { name: "My Score", value: myAvg, color: "#4f46e5" },
            { name: "Cohort Avg", value: studyRecommendations.summary.cohortAverageAccuracy ?? 0, color: "#94a3b8" },
            { name: "Topper Avg", value: studyRecommendations.summary.benchmarkAccuracy ?? 0, color: "#10b981" },
        ];

        const allWeakTopics = Array.from(new Set(attempts.flatMap(a => a.weakTopics))).slice(0, 5);

        return {
            success: true,
            data: { 
                profile, 
                subjectAccuracy, 
                attempts, 
                performanceTrend, 
                comparativeAnalysis,
                weakTopics: allWeakTopics,
                examTargetDays: examTarget.daysToExam,
                examTargetLabel: examTarget.label
            },
        };
    } catch (err) {
        console.error("getStudentHistory error:", err);
        return { success: false, message: err instanceof Error ? err.message : "Failed to fetch history." };
    }
}

/**
 * Starts a new exam attempt for the current student.
 */
export async function startMyExamAttempt(examId: string): Promise<ActionResponse<{ attemptId: string, studentId: string }>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT"]);
        const attempt = await startExamAttemptRecord(examId, user.id, { enforceVisibility: true });

        return { success: true, data: { attemptId: attempt.id, studentId: user.id } };
    } catch (err) {
        return { success: false, message: getActionErrorMessage(err, "Failed to start attempt.") };
    }
}

/**
 * Toggles a saved item for the current student.
 */
export async function toggleSavedItem(resourceId: string, type: "MATERIAL" | "EXAM"): Promise<ActionResponse<{ saved: boolean }>> {
    let currentUserId = "";

    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
        currentUserId = user.id;
        const normalizedResourceId = resourceId.trim();
        if (!normalizedResourceId) {
            return { success: false, message: "A resource id is required." };
        }

        const resourceExists = type === "MATERIAL"
            ? await prisma.studyMaterial.findUnique({
                where: { id: normalizedResourceId },
                select: { id: true },
            })
            : await prisma.exam.findUnique({
                where: { id: normalizedResourceId },
                select: { id: true },
            });

        if (!resourceExists) {
            return { success: false, message: "The selected item could not be found." };
        }

        const saved = await withSerializableTransaction(async (tx) => {
            const existing = await tx.savedItem.findUnique({
                where: {
                    studentId_resourceId_type: {
                        studentId: user.id,
                        resourceId: normalizedResourceId,
                        type,
                    },
                },
            });

            if (existing) {
                await tx.savedItem.delete({
                    where: { id: existing.id },
                });
                return false;
            }

            await tx.savedItem.create({
                data: {
                    studentId: user.id,
                    resourceId: normalizedResourceId,
                    type,
                },
            });
            return true;
        });

        revalidatePath("/student/saved-items");
        revalidatePath("/student/free-resources");
        revalidatePath("/student/exams");

        return {
            success: true,
            data: { saved },
            message: saved ? "Item saved successfully." : "Item removed from saved list."
        };
    } catch (error) {
        console.error("Error in toggleSavedItem:", error);
        if (currentUserId && isUniqueConstraintError(error)) {
            const existing = await prisma.savedItem.findUnique({
                where: {
                    studentId_resourceId_type: {
                        studentId: currentUserId,
                        resourceId: resourceId.trim(),
                        type,
                    },
                },
            });

            return {
                success: true,
                data: { saved: Boolean(existing) },
                message: existing ? "Item saved successfully." : "Item removed from saved list.",
            };
        }

        return { success: false, message: getActionErrorMessage(error, "Failed to update saved item.") };
    }
}

/**
 * Fetches all saved items for the current student, separated by category.
 */
export async function getSavedItems(): Promise<ActionResponse<{ materials: UnifiedMaterial[], exams: UnifiedExam[] }>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);

        const savedItems = await prisma.savedItem.findMany({
            where: { studentId: user.id },
            orderBy: { createdAt: "desc" },
        });

        const materialIds = savedItems.filter((i) => i.type === "MATERIAL").map((i) => i.resourceId);
        const examIds = savedItems.filter((i) => i.type === "EXAM").map((i) => i.resourceId);

        // Hydrate resources
        const [materialsRaw, examsRaw] = await Promise.all([
            prisma.studyMaterial.findMany({
                where: { id: { in: materialIds } },
                include: { uploadedBy: { select: { fullName: true } } },
            }),
            prisma.exam.findMany({
                where: { id: { in: examIds } },
                include: { 
                    teacher: { select: { fullName: true } },
                    questions: { select: { id: true } }
                },
            })
        ]);

        const materials: UnifiedMaterial[] = materialsRaw.map(m => ({
            id: m.id,
            title: m.title,
            category: m.category,
            type: m.subType,
            isPublic: m.isPublic,
            isProtected: m.isProtected,
            uploadedAt: m.createdAt,
            sizeInBytes: m.sizeInBytes
        }));

        const exams: UnifiedExam[] = examsRaw.map(e => ({
            id: e.id,
            title: e.title,
            category: e.category,
            totalQuestions: e.questions.length,
            durationMinutes: e.duration,
            difficulty: "Medium", // Default as not in model explicitly in a direct way here
        }));

        const materialMap = new Map(materials.map((material) => [material.id, material]));
        const examMap = new Map(exams.map((exam) => [exam.id, exam]));

        return { 
            success: true, 
            data: {
                materials: materialIds
                    .map((id) => materialMap.get(id))
                    .filter((material): material is UnifiedMaterial => Boolean(material)),
                exams: examIds
                    .map((id) => examMap.get(id))
                    .filter((exam): exam is UnifiedExam => Boolean(exam)),
            }
        };
    } catch (error) {
        console.error("Error in getSavedItems:", error);
        return { 
            success: false, 
            message: getActionErrorMessage(error, "Failed to fetch saved items."), 
            data: { materials: [], exams: [] } 
        };
    }
}
// ── Exam Hub Action ─────────────────────────────────────────────────────────

export async function getExamHubData(): Promise<ActionResponse<ExamHubData>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);

        // 1. Fetch Learning Profile for Stats and Goal
        const profile = await prisma.studentLearningProfile.findUnique({
            where: { studentId: user.id },
            include: { topicProgress: true }
        });

        // 2. Calculate Total Study Time (from submitted attempts)
        const attempts = await prisma.examAttempt.findMany({
            where: { studentId: user.id, status: "SUBMITTED" },
            select: { startTime: true, endTime: true, score: true, exam: { select: { totalMarks: true } } }
        });

        let totalMinutes = 0;
        let masteredCount = 0;
        attempts.forEach(a => {
            if (a.endTime && a.startTime) {
                totalMinutes += Math.round((a.endTime.getTime() - a.startTime.getTime()) / 60000);
            }
            if (a.exam.totalMarks > 0 && (a.score / a.exam.totalMarks) >= 0.8) {
                masteredCount++;
            }
        });

        // 3. Level Detection and Subject mapping
        const currentLevel = resolveStudentExamTarget(user).caLevelKey;

        let levelSubjects: { name: string, dbMatch: string, chapters: (string | { name: string })[] }[] = [];

        if (currentLevel === 'foundation') {
            levelSubjects = CA_FOUNDATION_CONTENT.subjects;
        } else if (currentLevel === 'ipc') {
            levelSubjects = CA_INTER_CONTENT.subjects;
        } else {
            levelSubjects = CA_FINAL_CONTENT.subjects;
        }

        const colors: ("emerald" | "amber" | "rose" | "indigo")[] = ["emerald", "amber", "rose", "indigo"];
        
        // Find all exams to link them to chapters later
        const allExams = await prisma.exam.findMany({
            where: { status: "PUBLISHED" },
            select: { id: true, subject: true, chapter: true }
        });

        const chapterWiseMCQs = await Promise.all(levelSubjects.map(async (sub, i) => {
            const relevantProgress = profile?.topicProgress.filter(tp => 
                tp.subject.toLowerCase().includes(sub.dbMatch.toLowerCase())
            ) || [];
            
            const totalAttempted = relevantProgress.reduce((sum, tp) => sum + tp.totalAttempted, 0);
            const totalCorrect = relevantProgress.reduce((sum, tp) => sum + tp.totalCorrect, 0);
            const avgAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) : 0;
            
            // Map chapters/topics from DB progress
            const chapters: { name: string; progress: number; questions: number; examId?: string }[] = relevantProgress.map(tp => {
                const linkedExam = allExams.find(e => 
                    e.subject?.toLowerCase().includes(sub.dbMatch.toLowerCase()) && 
                    e.chapter === tp.topic
                );

                return {
                    name: tp.topic,
                    progress: Math.round(tp.accuracy * 100),
                    questions: tp.totalAttempted || 50,
                    examId: linkedExam?.id
                };
            });

            // Fill missing chapters from metadata if we have them
            const metadataChapters = sub.chapters.map(c => typeof c === 'string' ? c : c.name);
            
            metadataChapters.forEach(mc => {
                if (!chapters.find(c => c.name === mc)) {
                    const linkedExam = allExams.find(e => 
                        e.subject?.toLowerCase().includes(sub.dbMatch.toLowerCase()) && 
                        e.chapter === mc
                    );
                    chapters.push({
                        name: mc,
                        progress: 0,
                        questions: 50,
                        examId: linkedExam?.id
                    });
                }
            });
            
            return {
                id: sub.name.toLowerCase().replace(/\s+/g, '-'),
                title: sub.name,
                chapters: chapters.length,
                questions: totalAttempted || (chapters.length * 50),
                progress: Math.round(avgAccuracy * 100),
                color: colors[i % colors.length],
                chapterDetails: chapters.slice(0, 10) // Show top 10 chapters
            };
        }));

        // 4. Mock Tests (Fetch all exams in student's category that are visible to this student)
        const examWhere = await buildStudentVisibleExamWhere(user.id, currentLevel);

        const examsRaw = await prisma.exam.findMany({
            where: examWhere,
            include: {
                teacher: { select: { fullName: true, email: true } },
                questions: true,
                attempts: {
                    where: { studentId: user.id },
                    orderBy: { startTime: "desc" },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const mockTests = examsRaw.map(e => {
            const lastAttempt = e.attempts[0];
            const isCompleted = lastAttempt?.status === "SUBMITTED";
            const isNew = !lastAttempt && (Date.now() - new Date(e.createdAt).getTime() < 7 * 24 * 3600_000);
            
            return {
                id: e.id,
                title: e.title,
                teacherName: e.teacher?.fullName || e.teacher?.email || "Teacher",
                isNew,
                isCompleted,
                score: isCompleted ? lastAttempt.score : undefined,
                totalMarks: e.totalMarks,
                attemptedDate: lastAttempt?.endTime?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                questions: e.questions.length,
                duration: e.duration,
                isLocked: false,
                lastAttemptId: lastAttempt?.id
            };
        });

        return {
            success: true,
            data: {
                stats: {
                    totalStudyTimeHours: Math.round(totalMinutes / 60),
                    avgProficiency: Math.round((profile?.avgAccuracy || 0) * 100),
                    examsMastered: masteredCount
                },
                practiceGoal: {
                    current: attempts.length,
                    target: profile?.practiceGoal || 20
                },
                chapterWiseMCQs,
                mockTests
            }
        };
    } catch (err) {
        console.error("getExamHubData error:", err);
        return { success: false, message: "Failed to fetch exam hub data." };
    }
}

/**
 * Updates the student's exam target (level) in their profile.
 */
export async function updateStudentLevel(level: "foundation" | "ipc" | "final"): Promise<ActionResponse<undefined>> {
    try {
        const user = await getCurrentUserOrDemoUser("STUDENT", ["STUDENT", "ADMIN"]);
        const existingTarget = resolveStudentExamTarget(user);
        const newTarget = buildStudentExamTargetLabel(
            level,
            existingTarget.attemptMonth,
            existingTarget.attemptYear,
        );
        
        await prisma.user.update({
            where: { id: user.id },
            data: {
                examTarget: newTarget,
                examTargetLevel: level,
                examTargetMonth: existingTarget.attemptMonth,
                examTargetYear: existingTarget.attemptYear,
            }
        });

        revalidatePath("/");
        revalidatePath("/student", "layout");
        revalidatePath("/student/dashboard");
        revalidatePath("/student/exams");
        revalidatePath("/student/profile");
        revalidatePath("/student/history");
        revalidatePath("/student/analytics");
        
        return { success: true, data: undefined };
    } catch (err) {
        console.error("updateStudentLevel error:", err);
        return { success: false, message: "Failed to update level." };
    }
}
