import { defineConfig } from '@prisma/config';
import "dotenv/config";
import fs from 'fs';
import path from 'path';

/**
 * 💡 ROBUST ENV RESOLVER
 * Aligns logic with prepare-prisma.js to ensure consistency between
 * client generation and CLI commands (push, migrate).
 */
function getActiveDatabaseUrl() {
  const envKeys = [
    'LOCAL_DATABASE_URL',
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'DOKPLOY_DATABASE_URL',
    'POSTGRES_INTERNAL_URL',
  ];

  const getEnvValue = (key: string) => {
    // 1. Check process.env
    const procVal = process.env[key]?.trim();
    if (procVal) return procVal;

    // 2. Manual fallback for .env file
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Match both quoted and unquoted values, handling \r if present
        const regex = new RegExp(`^${key}=\\s*["']?([^"'\r\n]+)["']?`, 'm');
        const match = envContent.match(regex);
        if (match && match[1]) return match[1].trim();
      }
    } catch (e) { /* ignore */ }
    return null;
  };

  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    const schema = fs.existsSync(schemaPath) ? fs.readFileSync(schemaPath, 'utf8') : '';
    const isPostgres = schema.includes('provider = "postgresql"');

    if (isPostgres) {
      // When provider is postgresql, prioritize any postgres-compatible URL
      for (const key of envKeys) {
        if (key === 'LOCAL_DATABASE_URL') continue;
        const val = getEnvValue(key);
        if (val && (val.startsWith('postgresql:') || val.startsWith('postgres:'))) {
          return val;
        }
      }
    }

    // Default priority order
    for (const key of envKeys) {
      const val = getEnvValue(key);
      if (val) return val;
    }

    return null;
  } catch (e) {
    return getEnvValue('DATABASE_URL');
  }
}

const databaseUrl = getActiveDatabaseUrl();

if (!databaseUrl) {
  console.warn('⚠️ [PrismaConfig] Could not resolve a valid DATABASE_URL from .env or process.env.');
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl || 'postgresql://aditya424:aditya424@financly-cadatabase-bxixqg:5432/financlycadatabase', // Prisma will throw a meaningful error if this is empty
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
});
