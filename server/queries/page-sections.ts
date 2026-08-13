import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { resolveStructural } from "@/lib/locale";
import type { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";
import { sectionSchemas, sectionFallbacks, type SectionKey, type SectionData } from "@/lib/validation/sections";

// Structural content — falls back to French + noindex when the requested
// locale's row is missing, never absent (a visitor on /ar/a-propos must
// never get a blank page). Editing happens elsewhere; this only proves the
// schema and fallback mechanics.
export async function getPageSection(page: PageKey, key: string, locale: LocaleCode) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.page(locale, `${page}:${key}`));

  const rows = await db.pageSection.findMany({ where: { page, key, published: true } });
  return resolveStructural(rows, locale);
}

// Typed, schema-validated read — never throws. A malformed row (or a row
// that doesn't parse against its key's schema) must never blank a public
// page: it falls back to the key's typed default instead.
// `localeFallback` mirrors resolveStructural's flag (row came from FR, not
// the requested locale); `isFallback` additionally covers "row existed but
// failed validation."
export async function getSection<K extends SectionKey>(
  page: PageKey,
  key: string,
  locale: LocaleCode,
): Promise<{ data: SectionData<K>; isFallback: boolean; localeFallback: boolean }> {
  const sectionKey = `${page}:${key}` as K;
  const schema = sectionSchemas[sectionKey];
  const { row, isFallback: localeFallback } = await getPageSection(page, key, locale);
  const parsed = row ? schema.safeParse(row.data) : { success: false as const };
  if (parsed.success) {
    return { data: parsed.data as SectionData<K>, isFallback: false, localeFallback };
  }
  return { data: sectionFallbacks[sectionKey] as SectionData<K>, isFallback: true, localeFallback };
}

// Admin-only editor read: every row for a page, every locale, published or
// not — deliberately not the cached public getPageSection/getSection, since
// the editor must show unpublished/all-locale rows uniformly. Also resolves
// every `imageId` referenced anywhere in the page's section data (top-level
// or nested inside item arrays) so the form can render thumbnails without a
// picker round-trip for content that's already set.
export async function listPageSectionsForAdmin(page: PageKey) {
  const rows = await db.pageSection.findMany({
    where: { page },
    orderBy: [{ order: "asc" }, { key: "asc" }],
  });

  const imageIds = new Set<string>();
  for (const row of rows) {
    for (const id of collectImageIds(row.data)) imageIds.add(id);
  }
  const images = imageIds.size
    ? await db.mediaAsset.findMany({
        where: { id: { in: Array.from(imageIds) } },
        select: { id: true, publicId: true, blurDataUrl: true },
      })
    : [];

  return { rows, imagesById: Object.fromEntries(images.map((image) => [image.id, image])) };
}

function collectImageIds(data: unknown): string[] {
  const ids: string[] = [];
  function walk(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        if (key === "imageId" && typeof nested === "string") ids.push(nested);
        else walk(nested);
      }
    }
  }
  walk(data);
  return ids;
}

// Admin-only: which (page, key) sections are missing which locales — backs
// the admin view showing which structural sections are still untranslated.
// Read-only; there is no PageSection write path yet.
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
