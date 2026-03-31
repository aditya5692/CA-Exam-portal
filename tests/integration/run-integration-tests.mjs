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

async function canPrepareIntegrationSchema(databaseUrl, schemaName) {
  if (databaseUrl.startsWith("file:")) {
    console.log(`[IntegrationTest] SQLite detected: using file-based database for isolation.`);
    return true;
  }

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
  if (databaseUrl.startsWith("file:")) {
    // For SQLite, we might want to delete the temp file, 
    // but the runner will handle clean-ups or we can leave it for debugging.
    return;
  }

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

// 💡 Priority: LOCAL_DATABASE_URL > DATABASE_URL for local tests
const sourceDatabaseUrl = process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;

if (!sourceDatabaseUrl) {
  console.warn("Skipping integration tests: LOCAL_DATABASE_URL or DATABASE_URL is not configured.");
  process.exit(0);
}

const isSqlite = sourceDatabaseUrl.startsWith("file:");
const schemaName = sanitizeSchemaName(`integration_${Date.now()}_${randomUUID().slice(0, 8)}`);

// For SQLite, create a unique test database file to prevent collision
const integrationDatabaseUrl = isSqlite 
  ? `file:./tests/.tmp/integration_${Date.now()}.db`
  : buildIntegrationDatabaseUrl(sourceDatabaseUrl, schemaName);

const env = {
  ...process.env,
  NODE_ENV: "test",
  DATABASE_URL: integrationDatabaseUrl,
  // Ensure the provider is forced to match the URL protocol
  PRISMA_GENERATE_DATASOURCE_URL: integrationDatabaseUrl,
};

const testFiles = [
  resolve("tests/integration/integration-flows.test.ts"),
];

let exitCode = 0;

if (!(await canPrepareIntegrationSchema(sourceDatabaseUrl, schemaName))) {
  process.exit(0);
}

try {
  // If SQLite, we need to ensure the directory exists
  if (isSqlite) {
    const dbPath = resolve(integrationDatabaseUrl.replace("file:", ""));
    const dbDir = resolve(dbPath, "..");
    if (!existsSync(dbDir)) {
      const fs = await import("node:fs");
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  console.log(`🚀 [IntegrationTest] Initializing database: ${integrationDatabaseUrl}`);
  
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
    [
      "--conditions=react-server",
      "--require",
      resolve("tests/support/register-test-runtime.cjs"),
      "--import",
      "tsx",
      "--test",
      "--test-concurrency=1",
      ...testFiles,
    ],
    env,
  );
} finally {
  await dropIntegrationSchema(sourceDatabaseUrl, schemaName).catch((error) => {
    const message = error instanceof Error ? error.message : "Unknown database error.";
    console.error(`Failed to drop integration schema "${schemaName}": ${message}`);
    exitCode = exitCode || 1;
  });

  // Clean up SQLite test files
  if (isSqlite && exitCode === 0) {
    const dbPath = resolve(integrationDatabaseUrl.replace("file:", ""));
    const fs = await import("node:fs");
    if (existsSync(dbPath)) fs.unlinkSync(dbPath);
    if (existsSync(`${dbPath}-journal`)) fs.unlinkSync(`${dbPath}-journal`);
    if (existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);
    if (existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
  }
}

process.exit(exitCode);
