import assert from "node:assert/strict";
import test from "node:test";

import {
  readDatabaseRuntimeConfig,
  redactDatabaseUrl,
} from "../../src/lib/prisma/runtime";

test("redactDatabaseUrl hides credentials while keeping host details", () => {
  assert.equal(
    redactDatabaseUrl("postgresql://user:secret@db.example.com:5432/ca_portal"),
    "postgresql://***:***@db.example.com:5432/ca_portal",
  );
});

test("readDatabaseRuntimeConfig returns defaults for a PostgreSQL URL", () => {
  const config = readDatabaseRuntimeConfig({
    DATABASE_URL: "postgresql://user:secret@127.0.0.1:5432/ca_portal",
  });

  assert.equal(config.protocol, "postgresql:");
  assert.equal(config.poolConfig.max, 10);
  assert.equal(config.poolConfig.connectionTimeoutMillis, 10_000);
  assert.equal(config.poolConfig.idleTimeoutMillis, 30_000);
});

test("readDatabaseRuntimeConfig respects pool overrides", () => {
  const config = readDatabaseRuntimeConfig({
    DATABASE_URL: "postgres://user:secret@127.0.0.1:5432/ca_portal",
    DATABASE_POOL_MAX: "25",
    DATABASE_CONNECT_TIMEOUT_MS: "15000",
    DATABASE_IDLE_TIMEOUT_MS: "45000",
    NODE_ENV: "production",
  });

  assert.equal(config.protocol, "postgres:");
  assert.equal(config.poolConfig.max, 25);
  assert.equal(config.poolConfig.connectionTimeoutMillis, 15_000);
  assert.equal(config.poolConfig.idleTimeoutMillis, 45_000);
  assert.equal(config.poolConfig.allowExitOnIdle, false);
});

test("readDatabaseRuntimeConfig rejects SQLite URLs with an explicit message", () => {
  assert.throws(
    () => readDatabaseRuntimeConfig({ DATABASE_URL: "file:./dev.db" }),
    /PostgreSQL-only/,
  );
});

test("readDatabaseRuntimeConfig rejects invalid integer overrides", () => {
  assert.throws(
    () =>
      readDatabaseRuntimeConfig({
        DATABASE_URL: "postgresql://user:secret@127.0.0.1:5432/ca_portal",
        DATABASE_POOL_MAX: "0",
      }),
    /DATABASE_POOL_MAX/,
  );
});
