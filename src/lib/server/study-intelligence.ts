import "server-only";

import prisma from "@/lib/prisma/client";
import type {
  StudentStudyRecommendations,
  StudyPriorityBand,
  StudySubjectFocus,
} from "@/types/learning";

type TopicProgressSnapshot = {
    subject: string;
    topic: string;
    accuracy: number;
    totalAttempted: number;
    totalCorrect: number;
    avgTimeSpent: number;
    nextReviewAt: Date;
    lastSeenAt: Date;
    difficulty: string;
};

type CohortAccuracyMap = Map<string, number>;

const DAY_IN_MS = 86_400_000;

function roundPercent(value: number) {
    return Math.round(Math.min(1, Math.max(0, value)) * 100);
}

function getDifficultyBonus(difficulty: string) {
    switch (difficulty.toUpperCase()) {
        case "HARD":
            return 10;
        case "MEDIUM":
            return 5;
        default:
            return 0;
    }
}

function getPriorityBand(priorityScore: number): StudyPriorityBand {
    if (priorityScore >= 70) return "HIGH";
    if (priorityScore >= 45) return "MEDIUM";
    return "LOW";
}

function getSuggestedAction(topic: TopicProgressSnapshot, dueForReview: boolean) {
    if (topic.accuracy < 0.5) {
        return "Relearn the concept and retake a short timed MCQ set.";
    }

    if (dueForReview) {
        return "Run a spaced-revision drill before starting a new paper.";
    }

    if (topic.avgTimeSpent > 75) {
        return "Practice timed questions to improve recall speed.";
    }

    return "Keep this topic warm with one targeted revision set.";
}

export function calculateTopicPriorityScore(topic: TopicProgressSnapshot, now = new Date()) {
    const boundedAccuracy = Math.min(1, Math.max(0, topic.accuracy));
    const accuracyPenalty = (1 - boundedAccuracy) * 55;
    const dueDeltaDays = Math.ceil((now.getTime() - topic.nextReviewAt.getTime()) / DAY_IN_MS);
    const dueBonus = dueDeltaDays >= 0
        ? 24 + Math.min(dueDeltaDays, 14) * 2
        : Math.max(0, 10 - Math.abs(dueDeltaDays));
    const freshnessDays = Math.max(0, Math.ceil((now.getTime() - topic.lastSeenAt.getTime()) / DAY_IN_MS));
    const freshnessBonus = Math.min(Math.max(freshnessDays - 3, 0), 12);
    const exposureBonus = topic.totalAttempted < 5 ? (5 - topic.totalAttempted) * 2 : 0;
    const speedBonus = topic.avgTimeSpent > 75 ? 6 : 0;

    return Math.round(
        accuracyPenalty +
        dueBonus +
        freshnessBonus +
        exposureBonus +
        speedBonus +
        getDifficultyBonus(topic.difficulty),
    );
}

function buildCohortAccuracyMap(
    rows: Array<{ subject: string; accuracy: number; totalAttempted: number }>,
): CohortAccuracyMap {
    const grouped = new Map<string, { weightedAccuracy: number; totalAttempted: number }>();

    for (const row of rows) {
        const existing = grouped.get(row.subject) ?? { weightedAccuracy: 0, totalAttempted: 0 };
        grouped.set(row.subject, {
            weightedAccuracy: existing.weightedAccuracy + (row.accuracy * row.totalAttempted),
            totalAttempted: existing.totalAttempted + row.totalAttempted,
        });
    }

    return new Map(
        Array.from(grouped.entries()).map(([subject, data]) => [
            subject,
            data.totalAttempted > 0 ? data.weightedAccuracy / data.totalAttempted : 0,
        ]),
    );
}

export function buildStudyRecommendations(params: {
    level: number;
    totalXP: number;
    streak: number;
    practiceGoal: number;
    completedThisWeek: number;
    benchmarkAccuracy: number | null;
    cohortAverageAccuracy: number | null;
    topicProgress: TopicProgressSnapshot[];
    cohortAccuracyBySubject: CohortAccuracyMap;
    now?: Date;
    limit?: number;
}): StudentStudyRecommendations {
    const now = params.now ?? new Date();
    const limit = Math.max(1, params.limit ?? 6);
    const priorityRows = params.topicProgress.map((topic) => {
        const priorityScore = calculateTopicPriorityScore(topic, now);
        const dueForReview = topic.nextReviewAt.getTime() <= now.getTime();

        return {
            topic,
            dueForReview,
            priorityScore,
            priorityBand: getPriorityBand(priorityScore),
        };
    });

    priorityRows.sort((left, right) => right.priorityScore - left.priorityScore);

    const priorityTopics = priorityRows.slice(0, limit).map(({ topic, dueForReview, priorityScore, priorityBand }) => ({
        subject: topic.subject,
        topic: topic.topic,
        accuracy: roundPercent(topic.accuracy),
        attempts: topic.totalAttempted,
        correct: topic.totalCorrect,
        dueForReview,
        nextReviewDate: topic.nextReviewAt.toISOString(),
        priorityScore,
        priorityBand,
        difficulty: topic.difficulty,
        suggestedAction: getSuggestedAction(topic, dueForReview),
    }));

    const groupedSubjects = new Map<string, TopicProgressSnapshot[]>();
    for (const topic of params.topicProgress) {
        const existing = groupedSubjects.get(topic.subject) ?? [];
        existing.push(topic);
        groupedSubjects.set(topic.subject, existing);
    }

    const rankedSubjectFocus = Array.from(groupedSubjects.entries())
        .map(([subject, topics]) => {
            const totalAttempted = topics.reduce((sum, topic) => sum + topic.totalAttempted, 0);
            const totalCorrect = topics.reduce((sum, topic) => sum + topic.totalCorrect, 0);
            const weakTopicCount = topics.filter((topic) => topic.accuracy < 0.6).length;
            const dueTopicCount = topics.filter((topic) => topic.nextReviewAt.getTime() <= now.getTime()).length;
            const averageAccuracy = totalAttempted > 0 ? totalCorrect / totalAttempted : 0;
            const cohortAverage = params.cohortAccuracyBySubject.get(subject) ?? null;
            const trend: StudySubjectFocus["trend"] = cohortAverage === null
                ? "STEADY"
                : averageAccuracy >= cohortAverage + 0.05
                    ? "IMPROVING"
                    : averageAccuracy <= cohortAverage - 0.05
                        ? "NEEDS_ATTENTION"
                        : "STEADY";

            return {
                subject,
                averageAccuracy: roundPercent(averageAccuracy),
                cohortAverageAccuracy: cohortAverage === null ? null : roundPercent(cohortAverage),
                weakTopicCount,
                dueTopicCount,
                recommendedMinutes: Math.min(90, Math.max(20, (weakTopicCount * 15) + (dueTopicCount * 10))),
                trend,
                rankingScore: (weakTopicCount * 20) + (dueTopicCount * 15) + (1 - averageAccuracy) * 25,
            };
        })
        .sort((left, right) => right.rankingScore - left.rankingScore);

    const subjectFocus = rankedSubjectFocus.map((focus) => ({
        subject: focus.subject,
        averageAccuracy: focus.averageAccuracy,
        cohortAverageAccuracy: focus.cohortAverageAccuracy,
        weakTopicCount: focus.weakTopicCount,
        dueTopicCount: focus.dueTopicCount,
        recommendedMinutes: focus.recommendedMinutes,
        trend: focus.trend,
    }));

    const dueForReviewCount = priorityRows.filter((row) => row.dueForReview).length;
    const weakTopicCount = params.topicProgress.filter((topic) => topic.accuracy < 0.6).length;
    const masteredTopicCount = params.topicProgress.filter((topic) => topic.accuracy >= 0.8).length;
    const topPrioritySubject = priorityTopics[0]?.subject ?? subjectFocus[0]?.subject ?? null;

    const remainingThisWeek = Math.max(params.practiceGoal - params.completedThisWeek, 0);
    const nextActions = Array.from(new Set([
        priorityTopics[0]
            ? `Start with ${priorityTopics[0].topic} in ${priorityTopics[0].subject}.`
            : "Start with one short mixed-topic revision set.",
        dueForReviewCount > 0
            ? `You have ${dueForReviewCount} topic${dueForReviewCount === 1 ? "" : "s"} due for spaced revision.`
            : "No overdue revision topics right now. Push a fresh practice set instead.",
        remainingThisWeek > 0
            ? `${remainingThisWeek} more completed attempt${remainingThisWeek === 1 ? "" : "s"} will hit this week's practice goal.`
            : "Weekly practice goal is already met. Use the surplus for weak-topic correction.",
    ]));

    return {
        summary: {
            level: params.level,
            totalXP: params.totalXP,
            streak: params.streak,
            practiceGoal: params.practiceGoal,
            completedThisWeek: params.completedThisWeek,
            remainingThisWeek,
            dueForReviewCount,
            weakTopicCount,
            masteredTopicCount,
            cohortAverageAccuracy: params.cohortAverageAccuracy,
            benchmarkAccuracy: params.benchmarkAccuracy,
            topPrioritySubject,
        },
        priorityTopics,
        subjectFocus,
        nextActions,
    };
}

export async function getStudentStudyRecommendations(
    studentId: string,
    limit = 6,
): Promise<StudentStudyRecommendations> {
    const normalizedStudentId = studentId.trim();
    if (!normalizedStudentId) {
        throw new Error("Student id is required.");
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - 6);

    const [profile, topicProgress, completedThisWeek, cohortProfiles] = await Promise.all([
        prisma.studentLearningProfile.findUnique({
            where: { studentId: normalizedStudentId },
            select: {
                level: true,
                totalXP: true,
                streak: true,
                practiceGoal: true,
            },
        }),
        prisma.topicProgress.findMany({
            where: { studentId: normalizedStudentId },
            select: {
                subject: true,
                topic: true,
                accuracy: true,
                totalAttempted: true,
                totalCorrect: true,
                avgTimeSpent: true,
                nextReviewAt: true,
                lastSeenAt: true,
                difficulty: true,
            },
            orderBy: [{ nextReviewAt: "asc" }, { accuracy: "asc" }],
        }),
        prisma.examAttempt.count({
            where: {
                studentId: normalizedStudentId,
                status: "SUBMITTED",
                endTime: { gte: weekStart },
            },
        }),
        prisma.studentLearningProfile.findMany({
            where: {
                studentId: { not: normalizedStudentId },
                totalAttempts: { gt: 0 },
            },
            select: { avgAccuracy: true },
            orderBy: { avgAccuracy: "desc" },
            take: 25,
        }),
    ]);

    const trackedSubjects = Array.from(new Set(topicProgress.map((topic) => topic.subject)));
    const cohortSubjectRows = trackedSubjects.length === 0
        ? []
        : await prisma.topicProgress.findMany({
            where: {
                studentId: { not: normalizedStudentId },
                subject: { in: trackedSubjects },
            },
            select: {
                subject: true,
                accuracy: true,
                totalAttempted: true,
            },
        });

    const cohortAccuracyBySubject = buildCohortAccuracyMap(cohortSubjectRows);
    const cohortAverageAccuracy = cohortProfiles.length > 0
        ? Math.round(
            (cohortProfiles.reduce((sum, row) => sum + row.avgAccuracy, 0) / cohortProfiles.length) * 100,
        )
        : null;
    const benchmarkAccuracy = cohortProfiles.length > 0
        ? Math.round(cohortProfiles[0].avgAccuracy * 100)
        : null;

    return buildStudyRecommendations({
        level: profile?.level ?? 1,
        totalXP: profile?.totalXP ?? 0,
        streak: profile?.streak ?? 0,
        practiceGoal: profile?.practiceGoal ?? 20,
        completedThisWeek,
        benchmarkAccuracy,
        cohortAverageAccuracy,
        topicProgress,
        cohortAccuracyBySubject,
        now,
        limit,
    });
}
