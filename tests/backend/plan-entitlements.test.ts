import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlanSummary,
  planIncludesAtLeast,
  resolvePlanEntitlement,
} from "../../src/lib/server/plan-entitlements";

test("resolvePlanEntitlement falls back safely for unknown plans", () => {
  const entitlement = resolvePlanEntitlement("unknown", "STUDENT");

  assert.equal(entitlement.displayName, "CA Pass");
  assert.equal(entitlement.isPremium, false);
});

test("planIncludesAtLeast respects plan rank within a role", () => {
  assert.equal(planIncludesAtLeast("ELITE", "STUDENT", "PRO"), true);
  assert.equal(planIncludesAtLeast("FREE", "STUDENT", "PRO"), false);
});

test("buildPlanSummary keeps actual storage usage and exposes the entitlement floor", () => {
  const summary = buildPlanSummary({
    plan: "PRO",
    role: "STUDENT",
    storageUsed: 64 * 1024 * 1024,
    storageLimit: 128 * 1024 * 1024,
  });

  assert.equal(summary.displayName, "CA Pass PRO");
  assert.equal(summary.isPremium, true);
  assert.equal(summary.storageLimit, 128 * 1024 * 1024);
  assert.equal(summary.entitledStorageLimit, 256 * 1024 * 1024);
  assert.equal(summary.canUpgrade, false);
});
