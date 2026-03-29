import assert from "node:assert/strict";
import test from "node:test";

import { getDemoOtpEntryByPhone } from "../../src/lib/auth/demo-otp";
import { verifyMsg91Otp, verifyMsg91WidgetToken } from "../../src/lib/server/msg91";

test("demo OTP lookup exposes teacher and student bypass entries", () => {
    const teacher = getDemoOtpEntryByPhone("7065751756");
    const student = getDemoOtpEntryByPhone("9000010001");

    assert.deepEqual(teacher, {
        phone: "917065751756",
        otp: "0424",
        widgetToken: "mock-verified-token",
    });
    assert.deepEqual(student, {
        phone: "919000010001",
        otp: "0424",
        widgetToken: "mock-verified-token:919000010001",
    });
});

test("verifyMsg91Otp accepts demo teacher and student OTPs in development", async () => {
    const teacherResult = await verifyMsg91Otp("7065751756", "0424");
    const studentResult = await verifyMsg91Otp("9000010001", "0424");

    assert.equal(teacherResult.success, true);
    assert.equal(studentResult.success, true);
});

test("verifyMsg91WidgetToken resolves demo teacher and student widget tokens in development", async () => {
    const teacherResult = await verifyMsg91WidgetToken("mock-verified-token");
    const studentResult = await verifyMsg91WidgetToken("mock-verified-token:919000010001");

    assert.deepEqual(teacherResult, {
        success: true,
        message: "Verified via Mock Bypass.",
        phone: "917065751756",
    });
    assert.deepEqual(studentResult, {
        success: true,
        message: "Verified via Mock Bypass.",
        phone: "919000010001",
    });
});
