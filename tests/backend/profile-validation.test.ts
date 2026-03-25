import assert from "node:assert/strict";
import test from "node:test";

import {
    ProfileValidationError,
    validateProfileInput,
} from "../../src/lib/profile-validation";

function buildFormData(entries: Record<string, string>) {
    const formData = new FormData();

    for (const [key, value] of Object.entries(entries)) {
        formData.append(key, value);
    }

    return formData;
}

test("validateProfileInput accepts empty optional student fields", () => {
    const result = validateProfileInput("STUDENT", buildFormData({}));

    assert.equal(result.fullName, null);
    assert.equal(result.email, null);
    assert.equal(result.examTargetMonth, null);
    assert.equal(result.examTargetYear, null);
    assert.equal(result.resumeUrl, null);
    assert.equal(result.articleshipYear, null);
    assert.equal(result.articleshipTotal, null);
});

test("validateProfileInput accepts printable symbols in profile text", () => {
    const result = validateProfileInput("STUDENT", buildFormData({
        fullName: "A <> # & Co.",
        bio: "Prep-focused, audit-heavy, loves RTPs.",
    }));

    assert.equal(result.fullName, "A <> # & Co.");
    assert.equal(result.bio, "Prep-focused, audit-heavy, loves RTPs.");
});

test("validateProfileInput rejects malformed numeric values instead of coercing them", () => {
    assert.throws(
        () => validateProfileInput("STUDENT", buildFormData({ articleshipYear: "3abc" })),
        (error: unknown) => {
            assert.ok(error instanceof ProfileValidationError);
            assert.equal(error.fieldErrors.articleshipYear, "Articleship year must be a whole number.");
            return true;
        },
    );
});

test("validateProfileInput rejects unsafe resume URLs", () => {
    assert.throws(
        () => validateProfileInput("STUDENT", buildFormData({ resumeUrl: "javascript:alert(1)" })),
        (error: unknown) => {
            assert.ok(error instanceof ProfileValidationError);
            assert.equal(error.fieldErrors.resumeUrl, "Enter a valid http:// or https:// URL.");
            return true;
        },
    );
});

test("validateProfileInput rejects unsupported control characters", () => {
    assert.throws(
        () => validateProfileInput("STUDENT", buildFormData({ fullName: `Adi${String.fromCharCode(7)}` })),
        (error: unknown) => {
            assert.ok(error instanceof ProfileValidationError);
            assert.equal(error.fieldErrors.fullName, "Full name contains unsupported control characters.");
            return true;
        },
    );
});

test("validateProfileInput requires attempt month and year together", () => {
    assert.throws(
        () => validateProfileInput("STUDENT", buildFormData({ examTargetMonth: "11" })),
        (error: unknown) => {
            assert.ok(error instanceof ProfileValidationError);
            assert.equal(error.fieldErrors.examTargetMonth, "Select both attempt month and attempt year.");
            assert.equal(error.fieldErrors.examTargetYear, "Select both attempt month and attempt year.");
            return true;
        },
    );
});
