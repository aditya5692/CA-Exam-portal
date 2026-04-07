import "server-only";

import prisma from "@/lib/prisma/client";

/**
 * Per-question speed benchmark data returned to the client.
 */
export type QuestionBenchmark = {
    questionId: string;
    /** Average time in seconds across ALL students who answered this question */
    avgTimeAll: number;
    /** Average time in seconds for students who PASSED the exam (score ≥ passing threshold) */
    avgTimePassing: number | null;
    /** How many unique students contributed data */
    respondents: number;
};

/** A map from questionId → benchmark stats for fast lookup */
export type BenchmarkMap = Record<string, QuestionBenchmark>;

/**
 * Computes per-question avg time statistics for all questions in a given exam.
 * Only includes SUBMITTED attempts so abandoned/expired data is excluded.
 *
 * Passing is defined as: score / totalMarks >= 0.5  (ICAI standard)
 * Falls back gracefully if no data exists yet.
 */
export async function getExamQuestionBenchmarks(examId: string): Promise<BenchmarkMap> {
    if (!examId?.trim()) return {};

    // Fetch all submitted attempts with their answers and scores
    const attempts = await prisma.examAttempt.findMany({
        where: {
            examId,
            status: "SUBMITTED",
        },
        select: {
            id: true,
            score: true,
            exam: {
                select: {
                    totalMarks: true,
                    passingMarks: true,
                },
            },
            answers: {
                select: {
                    questionId: true,
                    timeSpent: true,
                },
            },
        },
    });

    if (attempts.length === 0) return {};

    // Determine if each attempt is "passing"
    const passingAttemptIds = new Set<string>();
    for (const attempt of attempts) {
        const { totalMarks, passingMarks } = attempt.exam;
        const threshold = passingMarks > 0 ? passingMarks : totalMarks * 0.5;
        if (attempt.score >= threshold) {
            passingAttemptIds.add(attempt.id);
        }
    }

    // Aggregate per question
    const allStats = new Map<
        string,
        { totalTime: number; count: number; passingTotalTime: number; passingCount: number }
    >();

    for (const attempt of attempts) {
        const isPassing = passingAttemptIds.has(attempt.id);
        for (const answer of attempt.answers) {
            if (answer.timeSpent <= 0) continue; // skip un-timed answers
            const existing = allStats.get(answer.questionId) ?? {
                totalTime: 0,
                count: 0,
                passingTotalTime: 0,
                passingCount: 0,
            };
            allStats.set(answer.questionId, {
                totalTime: existing.totalTime + answer.timeSpent,
                count: existing.count + 1,
                passingTotalTime: isPassing ? existing.passingTotalTime + answer.timeSpent : existing.passingTotalTime,
                passingCount: isPassing ? existing.passingCount + 1 : existing.passingCount,
            });
        }
    }

    const result: BenchmarkMap = {};
    for (const [questionId, stats] of allStats.entries()) {
        result[questionId] = {
            questionId,
            avgTimeAll: Math.round(stats.totalTime / stats.count),
            avgTimePassing:
                stats.passingCount > 0
                    ? Math.round(stats.passingTotalTime / stats.passingCount)
                    : null,
            respondents: stats.count,
        };
    }

    return result;
}

/**
 * Computes the overall attempt-level speed summary given answers and a benchmark map.
 *
 * Returns:
 * - yourAvgTime: student's average time per answered question (seconds)
 * - peerAvgTime: weighted peer average for the same questions (seconds)
 * - passingAvgTime: weighted passing-student average for the same questions (seconds)
 * - percentDiff: positive = slower, negative = faster (vs passing avg)
 */
export function computeAttemptSpeedSummary(
    answers: { questionId: string; timeSpent: number }[],
    benchmarks: BenchmarkMap,
): {
    yourAvgTime: number;
    peerAvgTime: number;
    passingAvgTime: number | null;
    percentDiff: number | null;
    hasData: boolean;
} {
    const timedAnswers = answers.filter((a) => a.timeSpent > 0);
    if (timedAnswers.length === 0) {
        return { yourAvgTime: 0, peerAvgTime: 0, passingAvgTime: null, percentDiff: null, hasData: false };
    }

    const yourTotal = timedAnswers.reduce((s, a) => s + a.timeSpent, 0);
    const yourAvgTime = Math.round(yourTotal / timedAnswers.length);

    let peerTotal = 0;
    let peerCount = 0;
    let passingTotal = 0;
    let passingCount = 0;

    for (const answer of timedAnswers) {
        const bm = benchmarks[answer.questionId];
        if (!bm) continue;
        peerTotal += bm.avgTimeAll;
        peerCount++;
        if (bm.avgTimePassing != null) {
            passingTotal += bm.avgTimePassing;
            passingCount++;
        }
    }

    const peerAvgTime = peerCount > 0 ? Math.round(peerTotal / peerCount) : 0;
    const passingAvgTime = passingCount > 0 ? Math.round(passingTotal / passingCount) : null;

    const percentDiff =
        passingAvgTime != null && passingAvgTime > 0
            ? Math.round(((yourAvgTime - passingAvgTime) / passingAvgTime) * 100)
            : null;

    return {
        yourAvgTime,
        peerAvgTime,
        passingAvgTime,
        percentDiff,
        hasData: peerCount > 0,
    };
}

/** Format seconds as "1m 24s" or "45s" */
export function formatSeconds(seconds: number): string {
    if (seconds <= 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
}
