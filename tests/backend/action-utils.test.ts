import assert from "node:assert/strict";
import test from "node:test";

import {
  clampNumber,
  getActionErrorMessage,
  readJsonStringArray,
} from "../../src/lib/server/action-utils";

test("clampNumber bounds values", () => {
  assert.equal(clampNumber(5, 1, 3), 3);
  assert.equal(clampNumber(-2, 1, 3), 1);
  assert.equal(clampNumber(2, 1, 3), 2);
});

test("readJsonStringArray normalizes arrays and JSON strings", () => {
  assert.deepEqual(readJsonStringArray([" Audit ", "Tax", 42, null]), ["Audit", "Tax"]);
  assert.deepEqual(readJsonStringArray('[" Law ","DT"]'), ["Law", "DT"]);
  assert.deepEqual(readJsonStringArray("Single value"), ["Single value"]);
});

test("getActionErrorMessage prefers explicit error messages and fallback text", () => {
  assert.equal(getActionErrorMessage(new Error("Readable failure"), "Fallback"), "Readable failure");
  assert.equal(getActionErrorMessage({}, "Fallback"), "Fallback");
});

test("getActionErrorMessage classifies transient database connection failures", () => {
  const connectionError = Object.assign(new Error("connect ECONNREFUSED"), {
    code: "ECONNREFUSED",
  });

  assert.equal(
    getActionErrorMessage(connectionError, "Fallback"),
    "The database connection is temporarily unavailable. Please try again.",
  );
});

test("getActionErrorMessage classifies database configuration failures", () => {
  assert.equal(
    getActionErrorMessage(
      new Error("DATABASE_URL points to SQLite, but the current Prisma schema is PostgreSQL-only."),
      "Fallback",
    ),
    "The database configuration is invalid. Please check the server environment.",
  );
});
