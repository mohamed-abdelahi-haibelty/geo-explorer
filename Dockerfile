# syntax=docker/dockerfile:1
# 24, not 20: kysely / sanitize-html / @prisma/streams-local require Node >=22,
# and matching the Node line used to generate package-lock.json avoids `npm ci`
# lockfile-sync mismatches between npm versions.
FROM node:24-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Baked into the client bundle at build time — must be the real value.
ARG NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
ENV NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=$NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

# generateStaticParams for /[locale]/services/[slug], /[locale]/articles/[slug]
# and /[locale]/actualites/[slug] runs real Prisma queries during `next build`
# (Cache Components requires at least one real static param per route) — this
# one must be a real, reachable, migrated database, not a placeholder. Build
# with `--network=host` and a real --build-arg DATABASE_URL.
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# server/env.ts parses the rest at module scope too, so every route that
# imports it (directly or transitively) needs them to exist and be
# well-formed during `next build` — but nothing actually connects to these at
# build time, so placeholders are fine; real values come from the runtime
# .env at container start.
ENV BETTER_AUTH_SECRET="build-time-placeholder" \
    BETTER_AUTH_URL="https://example.com" \
    UPSTASH_REDIS_REST_URL="https://example.com" \
    UPSTASH_REDIS_REST_TOKEN="build-time-placeholder" \
    CLOUDINARY_CLOUD_NAME="placeholder" \
    CLOUDINARY_API_KEY="placeholder" \
    CLOUDINARY_API_SECRET="placeholder" \
    REVALIDATE_SECRET="build-time-placeholder" \
    RESEND_API_KEY="placeholder" \
    CONTACT_FROM_EMAIL="build@example.com" \
    NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    ENABLE_UPSTASH_CACHE_HANDLER=1

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["node", "server.js"]
