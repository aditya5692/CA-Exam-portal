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
    'DOKPLOY_DATABASE_URL',
    'POSTGRES_INTERNAL_URL',
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_PRISMA_URL',
    'POSTGRESQL_URL',
    'DATABASE_URI',
    'POSTGRES_EXTERNAL_URL',
  ];

  const getEnvValue = (key: string) => {
    // 1. Check process.env (provided by OS or dotenv)
    if (process.env[key] && process.env[key]!.trim()) {
      return process.env[key]!.trim();
    }

    // 2. Manual fallback: Read .env directly (handles weird path/loading issues)
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const regex = new RegExp(`^${key}=["']?([^"'\r\n]+)["']?`, 'm');
        const match = envContent.match(regex);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    } catch (e) {
      // Ignore filesystem errors during manual fallback
    }
    return null;
  };

  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) return getEnvValue('DATABASE_URL');

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const isPostgres = schema.includes('provider = "postgresql"');

    if (isPostgres) {
       // Search for ANY postgres-compatible URL in priority order
       for (const key of envKeys) {
         if (key === 'LOCAL_DATABASE_URL') continue; // Don't use sqlite for postgres provider
         const val = getEnvValue(key);
         if (val && (val.startsWith('postgresql:') || val.startsWith('postgres:'))) {
           return val;
         }
       }
    }

    // Default: Return the first available key matching priority
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
    url: databaseUrl || '', // Prisma will throw a meaningful error if this is empty
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
});
