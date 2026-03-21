import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateExamAttemptDeadline,
  isExamAttemptExpired,
  normalizeSubmittedAnswers,
} from "../../src/lib/server/exam-workflow";

test("calculateExamAttemptDeadline adds the exam duration to the start time", () => {
  const start = new Date("2026-01-01T10:00:00.000Z");
  const deadline = calculateExamAttemptDeadline(start, 90);

  assert.equal(deadline.toISOString(), "2026-01-01T11:30:00.000Z");
});

test("isExamAttemptExpired compares against the computed deadline", () => {
  const start = new Date("2026-01-01T10:00:00.000Z");

  assert.equal(
    isExamAttemptExpired(start, 60, new Date("2026-01-01T10:59:59.000Z")),
    false,
  );
  assert.equal(
    isExamAttemptExpired(start, 60, new Date("2026-01-01T11:00:00.000Z")),
    true,
  );
});

test("normalizeSubmittedAnswers trims ids, de-duplicates by question, and clamps time", () => {
  const answers = normalizeSubmittedAnswers([
    { questionId: " q1 ", selectedOptionId: " a1 ", timeSpent: 20.3 },
    { questionId: "q1", selectedOptionId: "a2", timeSpent: 30.7 },
    { questionId: " ", selectedOptionId: "a3", timeSpent: 10 },
    { questionId: "q2", selectedOptionId: " ", timeSpent: 10 },
    { questionId: "q3", selectedOptionId: "a4", timeSpent: -5 },
  ]);

  assert.deepEqual(answers, [
    { questionId: "q1", selectedOptionId: "a2", timeSpent: 31 },
    { questionId: "q3", selectedOptionId: "a4", timeSpent: 0 },
  ]);
});
