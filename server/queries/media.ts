import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import type { MediaType } from "@/prisma/generated/client";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { MEDIA_PAGE_SIZE } from "@/lib/validation/media";

export async function listMedia({ type, search, page }: { type?: MediaType; search?: string; page: number }) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  const where = {
    ...(type ? { type } : {}),
    ...(search
      ? {
          OR: [
            { originalFilename: { contains: search, mode: "insensitive" as const } },
            { alt: { contains: search, mode: "insensitive" as const } },
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

  const [articles, news, authors, services, partners, galleries] = await Promise.all([
    db.article.findMany({ where: { coverId: id }, select: { title: true } }),
    db.news.findMany({ where: { coverId: id }, select: { title: true } }),
    db.author.findMany({ where: { photoId: id }, select: { name: true } }),
    db.service.findMany({ where: { heroId: id }, select: { title: true } }),
    db.partner.findMany({ where: { logoId: id }, select: { name: true } }),
    db.newsMedia.findMany({ where: { mediaId: id }, select: { news: { select: { title: true } } } }),
  ]);

  return [
    ...articles.map((item) => ({ kind: "article" as const, label: item.title })),
    ...news.map((item) => ({ kind: "news" as const, label: item.title })),
    ...authors.map((item) => ({ kind: "author" as const, label: item.name })),
    ...services.map((item) => ({ kind: "service" as const, label: item.title })),
    ...partners.map((item) => ({ kind: "partner" as const, label: item.name })),
    ...galleries.map((item) => ({ kind: "gallery" as const, label: item.news.title })),
  ];
}

export async function getMediaUsageBatch(ids: string[]): Promise<MediaUsageItem[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.media);

  const results = await Promise.all(ids.map((id) => getMediaUsage(id)));
  return results.flat();
}
