import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://test:test@127.0.0.1:5432/testdb",
};

const testFiles = [
  resolve("tests/backend/action-utils.test.ts"),
  resolve("tests/backend/auth-otp.test.ts"),
  resolve("tests/backend/batch-utils.test.ts"),
  resolve("tests/backend/exam-workflow.test.ts"),
  resolve("tests/backend/msg91.test.ts"),
  resolve("tests/backend/plan-entitlements.test.ts"),
  resolve("tests/backend/platform-config.test.ts"),
  resolve("tests/backend/profile-validation.test.ts"),
  resolve("tests/backend/prisma-runtime.test.ts"),
  resolve("tests/backend/resource-intelligence.test.ts"),
  resolve("tests/backend/session-cookie-sync.test.ts"),
  resolve("tests/backend/storage-utils.test.ts"),
  resolve("tests/backend/student-level.test.ts"),
  resolve("tests/backend/study-intelligence.test.ts"),
];

const result = spawnSync(
  process.execPath,
  [
    "--conditions=react-server",
    "--require",
    resolve("tests/support/register-test-runtime.cjs"),
    "--import",
    "tsx",
    "--test",
    ...testFiles,
  ],
  {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
