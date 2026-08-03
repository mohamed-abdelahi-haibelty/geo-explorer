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
- Zod-validated environment config

## Getting Started

1. Copy the env template and fill in real values:

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

4. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Project Structure

- `app/` — Next.js routes (App Router)
- `components/` — UI components (shadcn/ui-based)
- `server/` — env validation, Prisma client singleton
- `lib/` — shared utilities (cache tags, etc.)
- `prisma/` — schema, migrations, seed script
- `docker/` — local development services

## Scripts

```bash
npm run dev     # start the dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # lint the codebase
```
