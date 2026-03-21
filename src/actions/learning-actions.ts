"use server";

import prisma from "@/lib/prisma/client";
import {
    clampNumber,
    getActionErrorMessage,
    readJsonStringArray,
    withSerializableTransaction,
} from "@/lib/server/action-utils";
import { ActionResponse } from "@/types/shared";

type QuestionResult = {
    questionId: string;
    subject: string;
    topic: string;
    isCorrect: boolean;
    timeSpent: number; // seconds
    selectedOptionId: string | null;
};

type LearningResult = {
    xpGained: number;
    newLevel: number;
    newStreak: number;
    badges: string[];
    weakTopics: string[];
    strongTopics: string[];
    improvedTopics: string[];
};

type AdaptiveQuestionInsight = {
    topic: string;
    accuracy: number;
    dueForReview: boolean;
};

// ── XP calculation ─────────────────────────────────────────────────────────
function calcXP(correct: number, total: number, streak: number, avgTime: number) {
    if (total <= 0) return 0;
    const base = correct * 5;                       // 5 XP per correct answer
    const accuracyBonus = correct / total >= 0.8 ? 20 : 0;  // 80%+ accuracy bonus
    const streakBonus = streak > 0 ? Math.min(streak * 2, 30) : 0;
    const speedBonus = avgTime < 45 ? 10 : 0;      // under 45 sec/question
    return base + accuracyBonus + streakBonus + speedBonus;
}

function levelFromXP(xp: number): number {
    return Math.floor(1 + Math.sqrt(xp / 50));
}

/**
 * Saves exam results and calculates adaptive learning progress for a student.
 */
export async function saveExamResultsAndUpdateLearning(
    studentId: string,
    examId: string,
    attemptId: string,
    questionResults: QuestionResult[]
): Promise<ActionResponse<LearningResult>> {
    try {
        const normalizedStudentId = studentId.trim();
        const normalizedExamId = examId.trim();
        const normalizedAttemptId = attemptId.trim();
        const normalizedResults = questionResults.map((result) => ({
            questionId: result.questionId.trim(),
            subject: result.subject.trim() || "General",
            topic: result.topic.trim() || "General",
            isCorrect: Boolean(result.isCorrect),
            timeSpent: clampNumber(Math.round(Number(result.timeSpent) || 0), 0, 24 * 60 * 60),
            selectedOptionId: result.selectedOptionId,
        }));

        const learningResult = await withSerializableTransaction(async (tx) => {
            if (!normalizedStudentId || !normalizedExamId || !normalizedAttemptId) {
                throw new Error("Student, exam, and attempt identifiers are required.");
            }

            const attempt = await tx.examAttempt.findUnique({
                where: { id: normalizedAttemptId },
                select: {
                    id: true,
                    studentId: true,
                    examId: true,
                    status: true,
                    endTime: true,
                },
            });

            if (!attempt) {
                throw new Error("Attempt not found.");
            }

            if (attempt.studentId !== normalizedStudentId || attempt.examId !== normalizedExamId) {
                throw new Error("Attempt details do not match the current submission.");
            }

            if (attempt.status !== "SUBMITTED") {
                throw new Error("Submit the exam before updating learning progress.");
            }

            let profile = await tx.studentLearningProfile.findUnique({ where: { studentId: normalizedStudentId } });
            const correct = normalizedResults.filter((q) => q.isCorrect).length;
            const total = normalizedResults.length;
            const avgTime = total > 0
                ? normalizedResults.reduce((sum, q) => sum + q.timeSpent, 0) / total
                : 0;
            const baseBadges: string[] = [];
            if (total > 0 && correct === total) baseBadges.push("PERFECT_SCORE");
            if (total > 0 && correct / total >= 0.8) baseBadges.push("HIGH_ACCURACY");
            if (total > 0 && avgTime < 30) baseBadges.push("SPEED_DEMON");

            const existingEvent = await tx.xPEvent.findFirst({
                where: {
                    studentId: normalizedStudentId,
                    reason: "EXAM_COMPLETED",
                    meta: { contains: `"attemptId":"${normalizedAttemptId}"` },
                },
                select: { id: true },
            });

            if (existingEvent && profile) {
                const weakTopics = Array.from(new Set(
                    normalizedResults
                        .filter((result) => !result.isCorrect)
                        .map((result) => result.topic),
                ));
                const strongTopics = Array.from(new Set(
                    normalizedResults
                        .filter((result) => result.isCorrect)
                        .map((result) => result.topic),
                ));

                return {
                    xpGained: 0,
                    newLevel: profile.level,
                    newStreak: profile.streak,
                    badges: readJsonStringArray(profile.badgesJson),
                    weakTopics,
                    strongTopics,
                    improvedTopics: [],
                };
            }

            const completedAt = attempt.endTime ?? new Date();
            const lastDate = profile?.lastAttemptAt;

            let newStreak = profile?.streak ?? 0;
            if (lastDate) {
                const completedMidnight = new Date(
                    completedAt.getFullYear(),
                    completedAt.getMonth(),
                    completedAt.getDate(),
                ).getTime();
                const lastMidnight = new Date(
                    lastDate.getFullYear(),
                    lastDate.getMonth(),
                    lastDate.getDate(),
                ).getTime();
                const dayDiff = Math.round((completedMidnight - lastMidnight) / 86_400_000);

                if (dayDiff === 0) {
                    newStreak = profile?.streak ?? 0;
                } else if (dayDiff === 1) {
                    newStreak = (profile?.streak ?? 0) + 1;
                } else {
                    newStreak = 1;
                }
            } else {
                newStreak = 1;
            }

            const xpGained = calcXP(correct, total, newStreak, avgTime);
            if (newStreak >= 7) {
                baseBadges.push("WEEK_STREAK");
            }

            if (!profile) {
                profile = await tx.studentLearningProfile.create({
                    data: {
                        studentId: normalizedStudentId,
                        totalXP: xpGained,
                        level: levelFromXP(xpGained),
                        streak: newStreak,
                        longestStreak: newStreak,
                        totalAttempts: 1,
                        totalCorrect: correct,
                        avgAccuracy: total > 0 ? correct / total : 0,
                        lastAttemptAt: completedAt,
                        badgesJson: Array.from(new Set(baseBadges)),
                        weakTopicsJson: [],
                    },
                });
            } else {
                const newTotalXP = profile.totalXP + xpGained;
                const newTotalAttempts = profile.totalAttempts + 1;
                const newTotalCorrect = profile.totalCorrect + correct;
                const previousQuestionCount = profile.totalAttempts > 0
                    ? Math.round(profile.totalCorrect / Math.max(profile.avgAccuracy, 0.0001))
                    : 0;
                const nextQuestionCount = previousQuestionCount + total;
                const mergedBadges = Array.from(new Set([
                    ...readJsonStringArray(profile.badgesJson),
                    ...baseBadges,
                ]));

                profile = await tx.studentLearningProfile.update({
                    where: { studentId: normalizedStudentId },
                    data: {
                        totalXP: newTotalXP,
                        level: levelFromXP(newTotalXP),
                        streak: newStreak,
                        longestStreak: Math.max(profile.longestStreak, newStreak),
                        totalAttempts: newTotalAttempts,
                        totalCorrect: newTotalCorrect,
                        avgAccuracy: nextQuestionCount > 0 ? newTotalCorrect / nextQuestionCount : 0,
                        lastAttemptAt: completedAt,
                        badgesJson: mergedBadges,
                    },
                });
            }

            await tx.xPEvent.create({
                data: {
                    studentId: normalizedStudentId,
                    profileId: profile.id,
                    xpDelta: xpGained,
                    reason: "EXAM_COMPLETED",
                    meta: JSON.stringify({
                        examId: normalizedExamId,
                        attemptId: normalizedAttemptId,
                        correct,
                        total,
                    }),
                },
            });

            const topicMap = new Map<string, { correct: number; total: number; timeSpent: number }>();
            for (const result of normalizedResults) {
                if (!result.questionId) {
                    continue;
                }

                const key = `${result.subject}||${result.topic}`;
                const existing = topicMap.get(key) ?? { correct: 0, total: 0, timeSpent: 0 };
                topicMap.set(key, {
                    correct: existing.correct + (result.isCorrect ? 1 : 0),
                    total: existing.total + 1,
                    timeSpent: existing.timeSpent + result.timeSpent,
                });
            }

            const weakTopics = new Set<string>();
            const strongTopics = new Set<string>();
            const improvedTopics = new Set<string>();

            for (const [key, data] of topicMap) {
                const [subject, topic] = key.split("||");
                const accuracy = data.total > 0 ? data.correct / data.total : 0;
                const avgTopicTime = data.total > 0 ? data.timeSpent / data.total : 0;
                const nextReviewDays = accuracy >= 0.8 ? 7 : accuracy >= 0.6 ? 3 : 1;
                const nextReview = new Date(completedAt);
                nextReview.setDate(nextReview.getDate() + nextReviewDays);

                const existing = await tx.topicProgress.findUnique({
                    where: { studentId_subject_topic: { studentId: normalizedStudentId, subject, topic } },
                });

                const newTotalAttempted = (existing?.totalAttempted ?? 0) + data.total;
                const newTotalCorrect = (existing?.totalCorrect ?? 0) + data.correct;
                const newAccuracy = newTotalAttempted > 0 ? newTotalCorrect / newTotalAttempted : 0;
                const newAvgTime = existing
                    ? ((existing.avgTimeSpent * existing.totalAttempted) + data.timeSpent) / Math.max(newTotalAttempted, 1)
                    : avgTopicTime;

                if (existing && newAccuracy > (existing.accuracy + 0.05)) {
                    improvedTopics.add(topic);
                }

                await tx.topicProgress.upsert({
                    where: { studentId_subject_topic: { studentId: normalizedStudentId, subject, topic } },
                    create: {
                        studentId: normalizedStudentId,
                        profileId: profile.id,
                        subject,
                        topic,
                        totalAttempted: data.total,
                        totalCorrect: data.correct,
                        accuracy,
                        avgTimeSpent: avgTopicTime,
                        lastSeenAt: completedAt,
                        nextReviewAt: nextReview,
                        difficulty: accuracy < 0.5 ? "HARD" : accuracy < 0.75 ? "MEDIUM" : "EASY",
                    },
                    update: {
                        totalAttempted: newTotalAttempted,
                        totalCorrect: newTotalCorrect,
                        accuracy: newAccuracy,
                        avgTimeSpent: newAvgTime,
                        nextReviewAt: nextReview,
                        lastSeenAt: completedAt,
                        difficulty: newAccuracy < 0.5 ? "HARD" : newAccuracy < 0.75 ? "MEDIUM" : "EASY",
                    },
                });

                if (accuracy < 0.5) weakTopics.add(topic);
                if (accuracy >= 0.8) strongTopics.add(topic);
            }

            const allWeakTopics = await tx.topicProgress.findMany({
                where: { studentId: normalizedStudentId, accuracy: { lt: 0.5 } },
                orderBy: { accuracy: "asc" },
                take: 10,
                select: { topic: true },
            });
            const mergedBadges = Array.from(new Set([
                ...readJsonStringArray(profile.badgesJson),
                ...baseBadges,
            ]));

            profile = await tx.studentLearningProfile.update({
                where: { studentId: normalizedStudentId },
                data: {
                    weakTopicsJson: allWeakTopics.map((topic) => topic.topic),
                    badgesJson: mergedBadges,
                },
            });

            return {
                xpGained,
                newLevel: profile.level,
                newStreak,
                badges: mergedBadges,
                weakTopics: Array.from(weakTopics),
                strongTopics: Array.from(strongTopics),
                improvedTopics: Array.from(improvedTopics),
            };
        });

        return {
            success: true,
            data: learningResult,
            message: "Progress updated successfully."
        };
    } catch (error) {
        console.error("saveExamResultsAndUpdateLearning error:", error);
        return { success: false, message: getActionErrorMessage(error, "Failed to update learning progress.") };
    }
}

/**
 * Fetches adaptive next questions/topics for a student based on their weaknesses.
 */
export async function getAdaptiveNextQuestions(
    studentId: string,
    subject: string,
    limit = 10,
): Promise<ActionResponse<AdaptiveQuestionInsight[]>> {
    try {
        const weakTopics = await prisma.topicProgress.findMany({
            where: { studentId, subject, accuracy: { lt: 0.7 } },
            orderBy: [{ accuracy: "asc" }, { nextReviewAt: "asc" }],
            take: limit,
        });

        return {
            success: true,
            data: weakTopics.map((t) => ({
                topic: t.topic,
                accuracy: Math.round(t.accuracy * 100),
                dueForReview: t.nextReviewAt <= new Date(),
            }))
        };
    } catch (error) {
        console.error("getAdaptiveNextQuestions error:", error);
        return { success: false, message: "Failed to fetch adaptive questions." };
    }
}
