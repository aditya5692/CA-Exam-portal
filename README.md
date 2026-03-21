## CA Exam Portal

Next.js 16 + TypeScript + Prisma PostgreSQL deployment for CA students and educators.

## Environment Setup

Use the right database URL for the environment you are running in.

### Dokploy App Runtime

Set this in the Dokploy app environment:

```env
DOKPLOY_DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@YOUR_DOKPLOY_DB_HOST:5432/DB_NAME
```

For your current Dokploy database, that host should be the internal host, not the public IP:

```env
DOKPLOY_DATABASE_URL=postgresql://aditya424:aditya424@financly-cadatabase-bxixqg:5432/financlycadatabase
```

### Local Development

If you want to test from your laptop, expose Postgres on a dedicated external port like `5433`, then use:

```env
LOCAL_DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@YOUR_SERVER_IP:5433/DB_NAME
```

Do not use port `3000` for the external database if the app is also running there.

## Getting Started

Create your local env file, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Check

You can verify the current DB target quickly with:

```bash
npm run db:check
```

It prints which env key was selected and whether the database is reachable.
