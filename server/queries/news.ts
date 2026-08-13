import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { NEWS_PAGE_SIZE } from "@/lib/validation/news";
import { toDbLocale, fromDbLocale } from "@/lib/locale";
import { Prisma } from "@/prisma/generated/client";
import type { PublishStatus, Locale as PrismaLocale } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

// Exported — server/queries/search.ts hydrates the same card shape for a
// news hit in the combined search results.
export const NEWS_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  publishedAt: true,
  news: {
    select: {
      id: true,
      eventDate: true,
      location: true,
      externalVideoUrl: true,
      cover: { select: { publicId: true, blurDataUrl: true, alt: true } },
      // Filtered relation count — a gallery video counts toward the "has
      // video" badge exactly like externalVideoUrl, without pulling the
      // whole gallery just to check it.
      _count: { select: { media: { where: { media: { type: "VIDEO" } } } } },
    },
  },
} as const;

// Admin overview — every locale at once (mirrors listArticlesAdmin), no
// locale param. Public news pages/queries are handled separately from this
// admin listing.
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

// Home page teaser — the 3 most recent published news items for the active
// locale. Separate from the public news index/detail pages; this is just
// enough to feed the home teaser.
export async function listLatestNewsPublic(locale: LocaleCode, limit = 3) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.newsList(locale));

  return db.newsTranslation.findMany({
    where: { locale: toDbLocale(locale), status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      publishedAt: true,
      news: {
        select: {
          id: true,
          eventDate: true,
          location: true,
          externalVideoUrl: true,
          cover: { select: { publicId: true, blurDataUrl: true, alt: true } },
        },
      },
    },
  });
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

// Public index — PUBLISHED only, one locale, mirrors listArticlesPublic's
// non-search branch (news has no tag filter, so no search-branch split is
// needed here).
export async function listNewsPublic({ locale, page }: { locale: LocaleCode; page: number }) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.newsList(locale));

  const where: Prisma.NewsTranslationWhereInput = { locale: toDbLocale(locale), status: "PUBLISHED" };

  const [items, total] = await Promise.all([
    db.newsTranslation.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * NEWS_PAGE_SIZE,
      take: NEWS_PAGE_SIZE,
      select: NEWS_LIST_SELECT,
    }),
    db.newsTranslation.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / NEWS_PAGE_SIZE)) };
}

// Independent publication — same rule as getArticleBySlugForPublic, never
// falls back to another locale. A miss is resolved by
// getNewsTranslationBySlugAnyLocale at the route layer.
export async function getNewsBySlugForPublic(locale: LocaleCode, slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news, TAGS.newsList(locale), TAGS.newsItem(locale, slug));

  const translation = await db.newsTranslation.findFirst({
    where: { locale: toDbLocale(locale), slug, status: "PUBLISHED" },
    include: {
      news: {
        include: {
          cover: true,
          media: { orderBy: { position: "asc" }, include: { media: true } },
        },
      },
    },
  });
  if (!translation) return null;
  const { id: translationId, news, ...rest } = translation;
  return { ...news, ...rest, translationId };
}

// Backs the news-page language switcher, mirrors getPublishedLocalesForArticle.
export async function getPublishedLocalesForNews(newsId: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news);

  const rows = await db.newsTranslation.findMany({
    where: { newsId, status: "PUBLISHED" },
    select: { locale: true, slug: true },
  });
  return rows.map((row) => ({ locale: fromDbLocale(row.locale), slug: row.slug }));
}

// Cross-locale lookup backing actualites/[slug]'s redirect-first shape
// (constraint 2) — mirrors getArticleTranslationBySlugAnyLocale exactly.
const LOCALE_PRIORITY: PrismaLocale[] = ["FR", "EN", "AR"];

export async function getNewsTranslationBySlugAnyLocale(slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news);

  const matches = await db.newsTranslation.findMany({
    where: { slug, status: "PUBLISHED" },
    select: { locale: true, slug: true },
  });
  if (matches.length === 0) return null;

  const best = LOCALE_PRIORITY.map((locale) => matches.find((m) => m.locale === locale)).find(
    (m): m is (typeof matches)[number] => m != null,
  );
  return best ? { locale: fromDbLocale(best.locale), slug: best.slug } : null;
}

// Backs actualites/[slug]/page.tsx's generateStaticParams — mirrors
// listPublishedSlugsForStaticParams's "always at least one real value" rule
// (Cache Components rejects an empty generateStaticParams array).
export async function listPublishedNewsSlugsForStaticParams(locale: LocaleCode): Promise<string[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.newsList(locale));

  const rows = await db.newsTranslation.findMany({
    where: { locale: toDbLocale(locale), status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.length > 0 ? rows.map((row) => row.slug) : ["__none__"];
}

// Backs app/sitemap.ts, mirrors listPublishedArticleTranslationsForSitemap.
export async function listPublishedNewsTranslationsForSitemap() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.news);

  return db.newsTranslation.findMany({
    where: { status: "PUBLISHED" },
    select: { newsId: true, locale: true, slug: true, updatedAt: true },
  });
}
