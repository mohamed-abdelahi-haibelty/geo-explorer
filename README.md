# GeoExplorer Services

Public website and admin back-office for GeoExplorer Services, a Mauritanian
geoscience and mining consultancy based in Nouakchott. The site presents the
firm's service lines, publishes technical articles and company news — with
ordered photo/video galleries — and routes prospect enquiries to the
client's inbox. Every piece of site content is editable from a single admin
back-office — no rebuild required. The public site is published in French,
English and Arabic (RTL); the admin back-office itself stays French-only.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) + React 19
- [Prisma 7](https://www.prisma.io) + PostgreSQL 16
- Tailwind CSS 4 + shadcn/ui
- [next-intl](https://next-intl.dev) (FR/EN/AR routing, messages, RTL)
- Tiptap 3 (rich text article editor) + sanitize-html
- Better Auth (admin login) + Upstash Ratelimit (login, contact form and
  upload rate limiting)
- Cloudinary (media storage, delivery, and image transforms)
- Resend (contact form notification email)
- Zod-validated environment config

## Getting Started

1. Copy the env template and fill in real values, including a real
   Cloudinary account (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) — the media
   library won't accept uploads without one — a real Upstash Redis database
   (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, free tier is
   enough), used for login and contact-form rate limiting, a real Resend
   account (`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`) for the contact form's
   notification email, and `REVALIDATE_SECRET`, used to sign draft-preview
   links:

   ```bash
   cp .env.example .env
   ```

2. Start Postgres:

   ```bash
   docker compose -f docker/docker-compose.dev.yml up -d
   ```

3. Install dependencies and apply migrations with the seed data:

   ```bash
   npm install
   npx prisma migrate reset
   ```

4. Create the admin account (email/password come from `ADMIN_EMAIL` /
   `ADMIN_INITIAL_PASSWORD` in `.env`, or pass them as arguments):

   ```bash
   npx tsx scripts/create-admin.ts
   ```

5. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the site, or
[http://localhost:3000/login](http://localhost:3000/login) for the admin
back-office.

## Production Deployment

Three services (`app`, `db`, `caddy`) via Docker Compose — Caddy issues and
renews its own TLS certificate from Let's Encrypt automatically, so there's
no manual certificate to obtain or renew. The only DNS requirement is a
plain A record for the domain pointing at the server; if the domain sits
behind a CDN/proxy (Cloudflare or otherwise), **disable proxying for that
hostname** first, or Caddy's HTTP-01 challenge can't complete.

1. On the server: clone the repo, then create both env files —
   `cp .env.example .env` (fill in real Cloudinary, Upstash Redis, Resend,
   `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`, `REVALIDATE_SECRET` and admin
   bootstrap values) and `cp docker/.env.example docker/.env` (a strong
   `POSTGRES_PASSWORD`).

2. `next build` needs a real, migrated, reachable Postgres — `"use cache"`
   under Cache Components requires at least one real static param per
   route, and `generateStaticParams` for services/articles/actualités runs
   actual Prisma queries at build time. `docker-compose.build-override.yml`
   temporarily publishes `db`'s port and adds a `tools` service (the same
   `builder` stage `app`'s own Dockerfile produces, which has `prisma` and
   `tsx` — the slim runtime image never does) so migrations and the seed can
   run before anything is actually serving traffic:

   ```bash
   cd docker
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml up -d db
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml build tools
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml run --rm tools npx prisma migrate deploy
   # Prisma 7 doesn't seed automatically during migrate deploy — the seed is idempotent, safe to (re)run.
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml run --rm tools npx prisma db seed
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml run --rm tools npx tsx scripts/create-admin.ts
   ```

3. Build the real app image against that now-migrated database (same
   `network: host` + real `DATABASE_URL`/`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   build args the overlay's `tools` service used), then switch to the
   plain compose file for good — from here on `db` has no published port,
   `app` and `db` only talk to each other over the Compose network:

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.build-override.yml build app
   docker compose -f docker-compose.yml down
   docker compose -f docker-compose.yml up -d
   ```

4. Re-run step 2's `tools` commands (rebuilding `tools` first) after any
   future schema change or admin-password reset — `app`'s own image never
   carries `prisma`/`tsx`.

A restart (`docker compose -f docker-compose.yml restart`, or a host
reboot) preserves both the database (`pgdata` volume) and the ISR cache
(`nextcache` volume, plus the shared Upstash Redis-backed cache handler in
`next.config.ts` — see `cache-handlers/upstash-cache-handler.js`).

## Project Structure

- `app/[locale]/(site)/` — public website routes (`fr`/`en`/`ar`)
- `app/(admin)/admin/` — admin back-office routes (French-only)
- `app/(internal)/` — admin sign-in and draft-preview routes
- `app/api/auth/` — Better Auth handler
- `app/api/cloudinary/` — signed upload endpoint for the media library
- `components/` — UI components (shadcn/ui-based), plus `editor/` (Tiptap)
  and `site/` (public-site components)
- `i18n/` — next-intl routing, request config and navigation helpers
- `messages/` — FR/EN/AR UI message catalogs
- `server/` — env validation, Prisma client singleton, auth config, actions,
  queries, and localized content services
- `lib/` — shared utilities (cache tags, locale helpers, slugs, etc.)
- `prisma/` — schema, migrations, seed script
- `scripts/` — admin account bootstrap/reset scripts
- `docker/` — local dev services (`docker-compose.dev.yml`) and production
  deployment (`docker-compose.yml`, `Caddyfile`, see above)

## Scripts

```bash
npm run dev      # start the dev server
npm run build    # production build
npm run start    # run the production build
npm run lint     # lint the codebase
npm run analyze  # Turbopack's own interactive bundle analyzer (@next/bundle-analyzer doesn't support Turbopack)

npx tsx scripts/create-admin.ts <email> <password>        # create the admin account
npx tsx scripts/reset-admin-password.ts <email>           # reset the admin password
```
