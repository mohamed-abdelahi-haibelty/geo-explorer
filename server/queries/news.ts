import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { NEWS_PAGE_SIZE } from "@/lib/validation/news";
import { Prisma } from "@/prisma/generated/client";
import type { PublishStatus } from "@/prisma/generated/client";

// Admin overview — every locale at once (mirrors listArticlesAdmin), no
// locale param. Public news pages/queries are Task 08's scope, not this
// one's — see the task's own "Out" line.
export async function listNewsAdmin({
  search,
  status,
  sort,
  page,
}: {
  search?: string;
  status?: PublishStatus;
  sort: "updated_desc" | "updated_asc";
  page: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news);

  const translationFilter: Prisma.NewsTranslationWhereInput = {
    ...(status ? { status } : {}),
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
  };

  const where: Prisma.NewsWhereInput = {
    ...(Object.keys(translationFilter).length > 0 ? { translations: { some: translationFilter } } : {}),
  };

  const [items, total] = await Promise.all([
    db.news.findMany({
      where,
      orderBy: { updatedAt: sort === "updated_asc" ? "asc" : "desc" },
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: {
        id: true,
        updatedAt: true,
        cover: { select: { publicId: true, blurDataUrl: true } },
        media: { select: { id: true } },
        translations: {
          select: { id: true, locale: true, status: true, title: true, slug: true, publishedAt: true, updatedAt: true },
        },
      },
    }),
    db.news.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) };
}

// Full record for the tab UI — all translations plus the shared gallery
// mounted at once, one round trip (mirrors getArticleForEdit).
export async function getNewsForEdit(id: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news);

  return db.news.findUnique({
    where: { id },
    include: {
      cover: true,
      media: { orderBy: { position: "asc" }, include: { media: true } },
      translations: true,
    },
  });
}
