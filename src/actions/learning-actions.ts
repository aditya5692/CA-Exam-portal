"use server";

import prisma from "@/lib/prisma/client";

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

// ── XP calculation ─────────────────────────────────────────────────────────
function calcXP(correct: number, total: number, streak: number, avgTime: number) {
    const base = correct * 5;                       // 5 XP per correct answer
    const accuracyBonus = correct / total >= 0.8 ? 20 : 0;  // 80%+ accuracy bonus
    const streakBonus = streak > 0 ? Math.min(streak * 2, 30) : 0;
    const speedBonus = avgTime < 45 ? 10 : 0;      // under 45 sec/question
    return base + accuracyBonus + streakBonus + speedBonus;
}

function levelFromXP(xp: number): number {
    return Math.floor(1 + Math.sqrt(xp / 50));
}

// ── Main action ────────────────────────────────────────────────────────────
export async function saveExamResultsAndUpdateLearning(
    studentId: string,
    examId: string,
    attemptId: string,
    questionResults: QuestionResult[]
): Promise<LearningResult> {
    const correct = questionResults.filter((q) => q.isCorrect).length;
    const total = questionResults.length;
    const avgTime = questionResults.reduce((s, q) => s + q.timeSpent, 0) / total;

    // 1. Upsert learning profile
    let profile = await prisma.studentLearningProfile.findUnique({ where: { studentId } });

    const today = new Date();
    const lastDate = profile?.lastAttemptAt;

    // Calculate day difference safely (handles month/year boundaries)
    let newStreak = profile?.streak ?? 0;
    if (lastDate) {
        const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
        const lastMidnight = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
        const dayDiff = Math.round((todayMidnight - lastMidnight) / 86_400_000);
        if (dayDiff === 0) {
            // Same day — keep streak unchanged, don't reset
            newStreak = profile?.streak ?? 0;
        } else if (dayDiff === 1) {
            // Consecutive day — extend streak
            newStreak = (profile?.streak ?? 0) + 1;
        } else {
            // Missed a day — reset
            newStreak = 1;
        }
    } else {
        newStreak = 1;
    }
    const xpGained = calcXP(correct, total, newStreak, avgTime);

    if (!profile) {
        profile = await prisma.studentLearningProfile.create({
            data: {
                studentId,
                totalXP: xpGained,
                level: levelFromXP(xpGained),
                streak: newStreak,
                longestStreak: newStreak,
                totalAttempts: 1,
                totalCorrect: correct,
                avgAccuracy: correct / total,
                lastAttemptAt: today,
            },
        });
    } else {
        const newTotalXP = profile.totalXP + xpGained;
        const newTotalAttempts = profile.totalAttempts + 1;
        const newTotalCorrect = profile.totalCorrect + correct;
        // totalAttempts counts exam sessions; for accuracy we need total questions ever answered.
        // We derive this from existing avgAccuracy × (totalAttempts × old series denominator) —
        // but that's fragile. Instead, store total questions in totalAttempts×avgAccuracy back-calc:
        // Since we always add `total` questions per session, cumulative questions = sum of all totals.
        // We infer it as: prevCumulativeQ = profile.totalAttempts * (profile.totalCorrect / Math.max(profile.avgAccuracy, 0.001))
        // Safer: track running correct vs running questions via totalCorrect / newCumulativeQ.
        const prevCumulativeQ = profile.totalAttempts > 0
            ? Math.round(profile.totalCorrect / Math.max(profile.avgAccuracy, 0.0001))
            : 0;
        const newCumulativeQ = prevCumulativeQ + total;
        profile = await prisma.studentLearningProfile.update({
            where: { studentId },
            data: {
                totalXP: newTotalXP,
                level: levelFromXP(newTotalXP),
                streak: newStreak,
                longestStreak: Math.max(profile.longestStreak, newStreak),
                totalAttempts: newTotalAttempts,
                totalCorrect: newTotalCorrect,
                avgAccuracy: newCumulativeQ > 0 ? newTotalCorrect / newCumulativeQ : 0,
                lastAttemptAt: today,
            },
        });
    }

    // 2. Log XP event
    await prisma.xPEvent.create({
        data: {
            studentId,
            profileId: profile.id,
            xpDelta: xpGained,
            reason: "EXAM_COMPLETED",
            meta: JSON.stringify({ examId, attemptId, correct, total }),
        },
    });

    // 3. Update topic progress per question
    const topicMap = new Map<string, { correct: number; total: number; timeSpent: number }>();
    for (const q of questionResults) {
        const key = `${q.subject}||${q.topic || "General"}`;
        const existing = topicMap.get(key) ?? { correct: 0, total: 0, timeSpent: 0 };
        topicMap.set(key, {
            correct: existing.correct + (q.isCorrect ? 1 : 0),
            total: existing.total + 1,
            timeSpent: existing.timeSpent + q.timeSpent,
        });
    }

    const weakTopics: string[] = [];
    const strongTopics: string[] = [];
    const improvedTopics: string[] = [];

    for (const [key, data] of topicMap) {
        const [subject, topic] = key.split("||");
        const accuracy = data.correct / data.total;
        const avgTopicTime = data.timeSpent / data.total;

        const nextReviewDays = accuracy >= 0.8 ? 7 : accuracy >= 0.6 ? 3 : 1;
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + nextReviewDays);

        const existing = await prisma.topicProgress.findUnique({
            where: { studentId_subject_topic: { studentId, subject, topic } },
        });

        const newTotalAttempted = (existing?.totalAttempted ?? 0) + data.total;
        const newTotalCorrect = (existing?.totalCorrect ?? 0) + data.correct;
        const newAccuracy = newTotalCorrect / newTotalAttempted;
        const newAvgTime = ((existing?.avgTimeSpent ?? avgTopicTime) + avgTopicTime) / 2;

        if (existing && newAccuracy > (existing.accuracy + 0.05)) {
            improvedTopics.push(topic);
        }

        await prisma.topicProgress.upsert({
            where: { studentId_subject_topic: { studentId, subject, topic } },
            create: {
                studentId,
                profileId: profile.id,
                subject,
                topic,
                totalAttempted: data.total,
                totalCorrect: data.correct,
                accuracy,
                avgTimeSpent: avgTopicTime,
                nextReviewAt: nextReview,
                difficulty: accuracy < 0.5 ? "HARD" : accuracy < 0.75 ? "MEDIUM" : "EASY",
            },
            update: {
                totalAttempted: newTotalAttempted,
                totalCorrect: newTotalCorrect,
                accuracy: newAccuracy,
                avgTimeSpent: newAvgTime,
                nextReviewAt: nextReview,
                lastSeenAt: today,
                difficulty: newAccuracy < 0.5 ? "HARD" : newAccuracy < 0.75 ? "MEDIUM" : "EASY",
            },
        });

        if (accuracy < 0.5) weakTopics.push(topic);
        if (accuracy >= 0.8) strongTopics.push(topic);
    }

    // 4. Update weak topics JSON on profile
    const allWeakTopics = await prisma.topicProgress.findMany({
        where: { studentId, accuracy: { lt: 0.5 } },
        orderBy: { accuracy: "asc" },
        take: 10,
        select: { topic: true },
    });
    await prisma.studentLearningProfile.update({
        where: { studentId },
        data: { weakTopicsJson: JSON.stringify(allWeakTopics.map((t) => t.topic)) },
    });

    // 5. Compute badges earned this session
    const badges: string[] = [];
    if (correct === total) badges.push("PERFECT_SCORE");
    if (newStreak >= 7) badges.push("WEEK_STREAK");
    if (correct / total >= 0.8) badges.push("HIGH_ACCURACY");
    if (avgTime < 30) badges.push("SPEED_DEMON");

    return {
        xpGained,
        newLevel: levelFromXP(profile.totalXP),
        newStreak,
        badges,
        weakTopics,
        strongTopics,
        improvedTopics,
    };
}

// ── Fetch adaptive next questions for a student ────────────────────────────
export async function getAdaptiveNextQuestions(studentId: string, subject: string, limit = 10) {
    // Get topics the student is weakest at in this subject
    const weakTopics = await prisma.topicProgress.findMany({
        where: { studentId, subject, accuracy: { lt: 0.7 } },
        orderBy: [{ accuracy: "asc" }, { nextReviewAt: "asc" }],
        take: limit,
    });

    return weakTopics.map((t) => ({
        topic: t.topic,
        accuracy: Math.round(t.accuracy * 100),
        dueForReview: t.nextReviewAt <= new Date(),
    }));
}
