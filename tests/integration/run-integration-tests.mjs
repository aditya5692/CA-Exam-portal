import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync,readFileSync } from "node:fs";
import { resolve } from "node:path";
import { URL } from "node:url";

import pg from "pg";

const { Pool } = pg;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const fileContents = readFileSync(filePath, "utf8");
  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = rawLine.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    const normalizedValue = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    process.env[key] = normalizedValue;
  }
}

function sanitizeSchemaName(value) {
  return value.replace(/[^a-zA-Z0-9_]/g, "_");
}

function buildIntegrationDatabaseUrl(sourceUrl, schemaName) {
  const url = new URL(sourceUrl);
  url.searchParams.set("schema", schemaName);
  return url.toString();
}

async function canPrepareIntegrationSchema(databaseUrl, schemaName) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    console.warn(`Skipping integration tests: unable to prepare PostgreSQL schema (${message}).`);
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}

async function dropIntegrationSchema(databaseUrl, schemaName) {
  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  } finally {
    await pool.end().catch(() => undefined);
  }
}

function runCommand(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  return result.status ?? 1;
}

loadEnvFile(resolve(".env"));
loadEnvFile(resolve(".env.local"));

const sourceDatabaseUrl = process.env.INTEGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!sourceDatabaseUrl) {
  console.warn("Skipping integration tests: INTEGRATION_DATABASE_URL or DATABASE_URL is not configured.");
  process.exit(0);
}

const schemaName = sanitizeSchemaName(`integration_${Date.now()}_${randomUUID().slice(0, 8)}`);
const integrationDatabaseUrl = buildIntegrationDatabaseUrl(sourceDatabaseUrl, schemaName);
const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: integrationDatabaseUrl,
  INTEGRATION_DATABASE_URL: integrationDatabaseUrl,
};
const testFiles = [
  resolve("tests/integration/integration-flows.test.ts"),
];

let exitCode = 0;

if (!(await canPrepareIntegrationSchema(sourceDatabaseUrl, schemaName))) {
  process.exit(0);
}

try {
  const prismaExitCode = runCommand(
    process.execPath,
    [resolve("node_modules/prisma/build/index.js"), "db", "push"],
    env,
  );

  if (prismaExitCode !== 0) {
    process.exit(prismaExitCode);
  }

  exitCode = runCommand(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", "--test", "--test-concurrency=1", ...testFiles],
    env,
  );
} finally {
  await dropIntegrationSchema(sourceDatabaseUrl, schemaName).catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    console.error(`Failed to drop integration schema "${schemaName}": ${message}`);
    exitCode = exitCode || 1;
  });
}

process.exit(exitCode);
