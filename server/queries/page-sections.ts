import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { resolveStructural } from "@/lib/locale";
import type { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

// Structural content — falls back to French + noindex when the requested
// locale's row is missing, never absent (Task 04a: "A visitor on
// /ar/a-propos must never get a blank page"). Editing is Task 06's scope;
// this only proves the schema and fallback mechanics.
export async function getPageSection(page: PageKey, key: string, locale: LocaleCode) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.page(locale, `${page}:${key}`));

  const rows = await db.pageSection.findMany({ where: { page, key, published: true } });
  return resolveStructural(rows, locale);
}

// Admin-only: which (page, key) sections are missing which locales — the
// "admin shows which structural sections are still untranslated" Done-when
// item (Task 04a). Read-only; there is no PageSection write path yet.
export async function listPageSectionCompleteness() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.settings);

  const rows = await db.pageSection.findMany({
    select: { page: true, key: true, locale: true, published: true },
    orderBy: [{ page: "asc" }, { key: "asc" }],
  });

  const byKey = new Map<string, { page: PageKey; key: string; locales: Set<string> }>();
  for (const row of rows) {
    const mapKey = `${row.page}:${row.key}`;
    const entry = byKey.get(mapKey) ?? { page: row.page, key: row.key, locales: new Set<string>() };
    if (row.published) entry.locales.add(row.locale);
    byKey.set(mapKey, entry);
  }

  return Array.from(byKey.values()).map((entry) => ({
    page: entry.page,
    key: entry.key,
    locales: entry.locales,
  }));
}
