import assert from "node:assert/strict";
import test from "node:test";

import {
    decryptPlatformConfigSecret,
    preparePlatformConfigForPersistence,
    validatePlatformConfigInput,
} from "../../src/lib/server/platform-config";

test("platform config secret persistence encrypts and decrypts secret fields", () => {
    process.env.JWT_SECRET = "test-jwt-secret-for-platform-config";

    const persisted = preparePlatformConfigForPersistence({
        razorpayKeySecret: "secret-value",
        razorpayKeyId: "rzp_test_1234567890",
    });

    assert.ok(persisted.razorpayKeySecret);
    assert.notEqual(persisted.razorpayKeySecret, "secret-value");
    assert.equal(
        decryptPlatformConfigSecret(persisted.razorpayKeySecret ?? null),
        "secret-value",
    );
    assert.equal(persisted.razorpayKeyId, "rzp_test_1234567890");
});

test("platform config validation rejects mismatched widget pair and malformed Razorpay ids", () => {
    assert.deepEqual(
        validatePlatformConfigInput({
            msg91WidgetId: "366341726377313535353337",
            msg91TokenAuth: null,
            razorpayKeyId: "bad-key",
            razorpayPlanPro: "recurring_bad",
        }),
        [
            "MSG91 Widget ID and Token Auth must be saved together.",
            "Razorpay Key ID must start with rzp_test_ or rzp_live_.",
            "Student Pro Monthly Plan ID must start with plan_.",
        ],
    );
});
