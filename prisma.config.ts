import { defineConfig } from '@prisma/config';
import "dotenv/config";

// 💡 PRIORITY: Always prefer local override for CLI commands (db push, migrate)
const databaseUrl = 
  process.env.LOCAL_DATABASE_URL || 
  process.env.DOKPLOY_DATABASE_URL ||
  process.env.DATABASE_URL;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: 'tsx ./prisma/seed.ts',
  },
});
