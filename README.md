# GeoExplorer Services

Public website and admin back-office for GeoExplorer Services, a Mauritanian
geoscience and mining consultancy based in Nouakchott. The site presents the
firm's service lines, publishes technical articles and company news, and
routes prospect enquiries to the client's inbox. Every piece of site content
is editable from a single admin back-office — no rebuild required. Site
language is French.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Cache Components) + React 19
- [Prisma 7](https://www.prisma.io) + PostgreSQL 16
- Tailwind CSS 4 + shadcn/ui
- Better Auth (admin login) + Upstash Ratelimit (login rate limiting)
- Cloudinary (media storage, delivery, and image transforms)
- Zod-validated environment config

## Getting Started

1. Copy the env template and fill in real values, including a real
   Cloudinary account (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`,
   `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) — the media
   library won't accept uploads without one:

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

## Project Structure

- `app/(site)/` — public website routes
- `app/(admin)/admin/` — admin back-office routes
- `app/login/` — admin sign-in page
- `app/api/auth/` — Better Auth handler
- `app/api/cloudinary/` — signed upload endpoint for the media library
- `components/` — UI components (shadcn/ui-based)
- `server/` — env validation, Prisma client singleton, auth config, actions, queries
- `lib/` — shared utilities (cache tags, etc.)
- `prisma/` — schema, migrations, seed script
- `scripts/` — admin account bootstrap/reset scripts
- `docker/` — local development services

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint the codebase

npx tsx scripts/create-admin.ts <email> <password>        # create the admin account
npx tsx scripts/reset-admin-password.ts <email>           # reset the admin password
```
