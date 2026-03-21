import assert from "node:assert/strict";
import test from "node:test";

import {
  buildStudyRecommendations,
  calculateTopicPriorityScore,
} from "../../src/lib/server/study-intelligence";

const now = new Date("2026-03-21T00:00:00.000Z");

const overdueWeakTopic = {
  subject: "Taxation",
  topic: "GST Input Tax Credit",
  accuracy: 0.42,
  totalAttempted: 3,
  totalCorrect: 1,
  avgTimeSpent: 92,
  nextReviewAt: new Date("2026-03-18T00:00:00.000Z"),
  lastSeenAt: new Date("2026-03-10T00:00:00.000Z"),
  difficulty: "HARD",
};

const stableTopic = {
  subject: "Accounting",
  topic: "Bank Reconciliation Statement",
  accuracy: 0.88,
  totalAttempted: 12,
  totalCorrect: 11,
  avgTimeSpent: 34,
  nextReviewAt: new Date("2026-03-25T00:00:00.000Z"),
  lastSeenAt: new Date("2026-03-20T00:00:00.000Z"),
  difficulty: "EASY",
};

test("calculateTopicPriorityScore prioritizes overdue weak topics", () => {
  assert.ok(
    calculateTopicPriorityScore(overdueWeakTopic, now) >
      calculateTopicPriorityScore(stableTopic, now),
  );
});

test("buildStudyRecommendations surfaces the weak subject first", () => {
  const recommendations = buildStudyRecommendations({
    level: 4,
    totalXP: 480,
    streak: 3,
    practiceGoal: 6,
    completedThisWeek: 2,
    benchmarkAccuracy: 88,
    cohortAverageAccuracy: 71,
    topicProgress: [stableTopic, overdueWeakTopic],
    cohortAccuracyBySubject: new Map([
      ["Taxation", 0.63],
      ["Accounting", 0.75],
    ]),
    now,
    limit: 2,
  });

  assert.equal(recommendations.priorityTopics[0]?.topic, "GST Input Tax Credit");
  assert.equal(recommendations.summary.remainingThisWeek, 4);
  assert.equal(recommendations.subjectFocus[0]?.subject, "Taxation");
});
