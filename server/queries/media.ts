import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import type { MediaType } from "@/prisma/generated/client";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { MEDIA_PAGE_SIZE } from "@/lib/validation/media";

export async function listMedia({ type, search, page }: { type?: MediaType; search?: string; page: number }) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  // `alt` is locale-keyed JSON now — Prisma's plain `contains` string filter
  // doesn't apply to Json columns; `string_contains` with an explicit path
  // does. Searches the French value only (the admin's working language).
  const where = {
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { originalFilename: { contains: search, mode: "insensitive" as const } },
            { alt: { path: ["fr"], string_contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    db.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MEDIA_PAGE_SIZE,
      take: MEDIA_PAGE_SIZE,
    }),
    db.mediaAsset.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / MEDIA_PAGE_SIZE)) };
}

export type MediaUsageKind = "article" | "news" | "author" | "service" | "partner" | "gallery";
export type MediaUsageItem = { kind: MediaUsageKind; label: string };

// Named references, not a bare count — an admin deciding whether to delete an
// asset needs to know *what* breaks, not just how many things do.
export async function getMediaUsage(id: string): Promise<MediaUsageItem[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  // Title now lives on the translation row — the FR one stands in as the
  // admin-facing label (admin works in French), falling back to whichever
  // locale exists if FR was never written (e.g. an EN-only draft).
  const FR_TITLE = { translations: { select: { locale: true, title: true } } } as const;

  function bestTitle(translations: { locale: string; title: string }[]): string {
    return translations.find((t) => t.locale === "FR")?.title ?? translations[0]?.title ?? "(sans titre)";
  }

  const [articles, news, authors, services, partners, galleries] = await Promise.all([
    db.article.findMany({ where: { coverId: id }, select: FR_TITLE }),
    db.news.findMany({ where: { coverId: id }, select: FR_TITLE }),
    db.author.findMany({ where: { photoId: id }, select: { name: true } }),
    db.service.findMany({ where: { heroId: id }, select: { translations: { select: { locale: true, title: true } } } }),
    db.partner.findMany({ where: { logoId: id }, select: { name: true } }),
    db.newsMedia.findMany({ where: { mediaId: id }, select: { news: { select: FR_TITLE } } }),
  ]);

  return [
    ...articles.map((item) => ({ kind: "article" as const, label: bestTitle(item.translations) })),
    ...news.map((item) => ({ kind: "news" as const, label: bestTitle(item.translations) })),
    ...authors.map((item) => ({ kind: "author" as const, label: item.name })),
    ...services.map((item) => ({ kind: "service" as const, label: bestTitle(item.translations) })),
    ...partners.map((item) => ({ kind: "partner" as const, label: item.name })),
    ...galleries.map((item) => ({ kind: "gallery" as const, label: bestTitle(item.news.translations) })),
  ];
}

// Public read — resolves the handful of `imageId` fields a
// PageSection/Service/Partner row can carry into renderable
// {publicId, blurDataUrl, alt} shapes, keyed by id. Most of these are still
// unset (no media has been uploaded through the picker in this environment
// yet), so callers must treat a missing id in the returned map as "no
// image", not an error.
export async function getMediaAssetsByIds(ids: string[]) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return {} as Record<string, { publicId: string; blurDataUrl: string | null; alt: unknown }>;

  const rows = await db.mediaAsset.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, publicId: true, blurDataUrl: true, alt: true },
  });
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

export async function getMediaUsageBatch(ids: string[]): Promise<MediaUsageItem[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  const results = await Promise.all(ids.map((id) => getMediaUsage(id)));
  return results.flat();
}
