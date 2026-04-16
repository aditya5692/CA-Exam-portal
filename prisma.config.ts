import { defineConfig } from '@prisma/config';
import "dotenv/config";
import fs from 'fs';
import path from 'path';

function getActiveDatabaseUrl() {
  try {
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
    if (!fs.existsSync(schemaPath)) return process.env.DATABASE_URL;

    const schema = fs.readFileSync(schemaPath, 'utf8');
    const isPostgres = schema.includes('provider = "postgresql"');

    if (isPostgres) {
       // Priority for Postgres
       return (
         process.env.DOKPLOY_DATABASE_URL ||
         process.env.POSTGRES_INTERNAL_URL ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL
       );
    }

    // Default to SQLite/Local if not postgres
    return process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL;
  } catch (e) {
    return process.env.DATABASE_URL;
  }
}

const databaseUrl = getActiveDatabaseUrl();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
});
