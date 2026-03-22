import assert from "node:assert/strict";
import test from "node:test";

import { getStudentCACategory,resolveStudentCALevel } from "../../src/lib/student-level";

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
