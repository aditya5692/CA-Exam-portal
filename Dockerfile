ARG NODE_VERSION=22.13.0
ARG PRISMA_GENERATE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ca_portal

FROM node:${NODE_VERSION}-slim AS base

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY scripts ./scripts

ENV DATABASE_URL=${PRISMA_GENERATE_DATABASE_URL}
RUN npm ci --no-audit --no-fund
RUN npm run prisma:generate

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build optimization for lower-memory VPS targets.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1280"
RUN npx next build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Manual runtime dependency injection for standalone mode.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

EXPOSE 3000

# 🏁 Startup command: Push DB schema changes then start the server
CMD ["sh", "-c", "./node_modules/.bin/prisma db push && node server.js"]
