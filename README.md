## CA Exam Portal

Next.js 16 + TypeScript + Prisma deployment for CA students and educators.

## Environment Setup

Copy `.env.example` to `.env` and fill in the production values for your environment.

### Dokploy App Runtime

Use the internal Dokploy database hostname inside the Dokploy app, not the public IP:

```env
DOKPLOY_DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@YOUR_DOKPLOY_DB_HOST:5432/DB_NAME
JWT_SECRET=replace-with-a-long-random-secret
AUTH_COOKIE_DOMAIN=.your-root-domain.com
MSG91_AUTH_KEY=...
MSG91_WIDGET_ID=...
NEXT_PUBLIC_MSG91_WIDGET_ID=...
NEXT_PUBLIC_MSG91_TOKEN_AUTH=...
RAZORPAY_KEY_ID=...
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
NEXT_PUBLIC_RAZORPAY_PLAN_BASIC=...
NEXT_PUBLIC_RAZORPAY_PLAN_PRO=...
```

### Local Development

For local testing you can use either:

```env
DATABASE_URL=file:./dev.db
```

or a forwarded Dokploy/Postgres connection such as:

```env
LOCAL_DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@YOUR_SERVER_IP:5433/DB_NAME
```

Do not reuse port `3000` for the database if the app is also running there.

## Getting Started

Run:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Health Checks

Dokploy health checks should use:

```text
/api/health/live
/api/health/ready
```

`/api/health/live` only confirms the app is running.  
`/api/health/ready` verifies required auth/payment env vars, database reachability, and outbound reachability to MSG91 and Razorpay before traffic should be routed.

## Database Check

You can verify which database URL is being used with:

```bash
npm run db:check
```
