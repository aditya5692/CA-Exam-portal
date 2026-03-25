import assert from "node:assert/strict";
import test from "node:test";

import {
    getStudentCACategory,
    normalizeStudentExamTargetInput,
    resolveStudentCALevel,
    resolveStudentExamTarget,
} from "../../src/lib/student-level";

test("resolveStudentCALevel falls back to department when exam target only contains attempt dates", () => {
    assert.equal(
        resolveStudentCALevel("November 2026", "CA Intermediate"),
        "ipc",
    );
});

test("resolveStudentCALevel prioritizes explicit foundation targets", () => {
    assert.equal(
        resolveStudentCALevel("CA Foundation May 2027", "CA Final"),
        "foundation",
    );
});

test("resolveStudentCALevel prefers an explicit exam target over department fallback", () => {
    assert.equal(
        resolveStudentCALevel("CA Final November 2026", "CA Intermediate"),
        "final",
    );
});

test("getStudentCACategory maps level keys to publish categories", () => {
    assert.equal(getStudentCACategory("foundation"), "CA Foundation");
    assert.equal(getStudentCACategory("ipc"), "CA Intermediate");
    assert.equal(getStudentCACategory("final"), "CA Final");
});

test("resolveStudentExamTarget prefers structured target fields over conflicting legacy text", () => {
    const target = resolveStudentExamTarget({
        examTarget: "CA Foundation May 2027",
        examTargetLevel: "final",
        examTargetMonth: 11,
        examTargetYear: 2026,
        department: "CA Intermediate",
    });

    assert.equal(target.caLevelKey, "final");
    assert.equal(target.attemptMonth, 11);
    assert.equal(target.attemptYear, 2026);
    assert.equal(target.label, "CA Final Nov 2026");
});

test("normalizeStudentExamTargetInput rebuilds one canonical exam target label", () => {
    const normalized = normalizeStudentExamTargetInput({
        caLevel: "CA Intermediate",
        examTargetMonth: "5",
        examTargetYear: "2028",
        examTarget: "old target",
        department: "CA Foundation",
    });

    assert.equal(normalized.examTargetLevel, "ipc");
    assert.equal(normalized.examTargetMonth, 5);
    assert.equal(normalized.examTargetYear, 2028);
    assert.equal(normalized.examTarget, "CA Intermediate May 2028");
});
