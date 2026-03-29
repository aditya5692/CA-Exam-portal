## CA Exam Portal

Next.js 16 + TypeScript + Prisma deployment for CA students and educators.

## Environment Setup

Copy `.env.example` to `.env` and fill in the values needed to boot the app.

### Dokploy App Runtime

Use the internal Dokploy database hostname inside the Dokploy app, not the public IP:

```env
DOKPLOY_DATABASE_URL=postgresql://DB_USER:DB_PASSWORD@YOUR_DOKPLOY_DB_HOST:5432/DB_NAME
JWT_SECRET=replace-with-a-long-random-secret
AUTH_COOKIE_DOMAIN=.your-root-domain.com
```

Razorpay and MSG91 values now support two modes:

1. Bootstrap/fallback env values in `.env`
2. Runtime values saved in `Admin > Control Center > Integrations`

Recommended bootstrap env keys:

```env
MSG91_AUTH_KEY=...
MSG91_WIDGET_ID=...
MSG91_OTP_TEMPLATE_ID=...
MSG91_TOKEN_AUTH=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
RAZORPAY_PLAN_BASIC=...
RAZORPAY_PLAN_PRO=...
```

Once an admin saves those values in the integrations panel, Dokploy no longer needs separate MSG91 and Razorpay runtime env entries for normal operation. Legacy `NEXT_PUBLIC_*` env names are still accepted as fallback if you already use them.

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
`/api/health/ready` verifies required auth/payment runtime config plus database reachability and outbound reachability to MSG91 and Razorpay before traffic should be routed.

## Database Sync on Deploy

This project currently uses `prisma db push` at container start in both Docker and Nixpacks paths so schema changes like new runtime config tables are applied automatically on boot.

## GitHub Actions Deploy

This repo includes `.github/workflows/deploy-dokploy.yml` to build the Docker image on every push to `master`, push it to Docker Hub, optionally trigger Dokploy via webhook, and optionally verify the live deployment with a health check.

Configure these GitHub repository secrets before enabling it:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
DOKPLOY_WEBHOOK_URL        # optional
APP_HEALTHCHECK_URL        # optional, example: https://your-domain.com/api/health/ready
```

Optional GitHub repository variable:

```text
DOCKERHUB_IMAGE_NAME       # example: aditya5692/ca-exam-portal
```

If `DOCKERHUB_IMAGE_NAME` is not set, the workflow defaults to:

```text
<DOCKERHUB_USERNAME>/ca-exam-portal
```

If Dokploy is already polling Docker Hub for new images, you can leave `DOKPLOY_WEBHOOK_URL` unset and the workflow will skip the webhook step without failing.

## Database Check

You can verify which database URL is being used with:

```bash
npm run db:check
```
