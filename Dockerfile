ARG NODE_VERSION=22.13.0

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

RUN npm ci --no-audit --no-fund
RUN npm run prisma:generate

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 🚀 [Optimization] Limit memory for next build on 2GB RAM VPS
# Disable linting and TS check during the build stage to save RAM
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=1280"
# 🛠 [Build Optimization] Fresh build command
RUN npx next build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install curl for Dokploy/Swarm Health Checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 🛠 [Manual Dependency Injection] 
# Because these are marked as 'external', Next.js standalone mode DOES NOT bundle them.
# We must manually copy them from the builder to ensure database connectivity works.
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Next.js standalone server entry point
CMD ["node", "server.js"]
