import assert from "node:assert/strict";
import test from "node:test";

import { generateJoinCode,normalizeJoinCode } from "../../src/lib/server/batch-utils";

test("normalizeJoinCode trims and uppercases values", () => {
  assert.equal(normalizeJoinCode("  ca-final-01  "), "CA-FINAL-01");
});

test("generateJoinCode produces the expected slug-prefix format", () => {
  const code = generateJoinCode("Advanced Audit");

  assert.match(code, /^ADVANCED-[A-F0-9]{6}$/);
});
