import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { toDbLocale, fromDbLocale } from "@/lib/locale";
import { ARTICLES_PAGE_SIZE } from "@/lib/validation/articles";
import { TS_SEARCH_CONFIG } from "@/lib/search-config";
import { Prisma } from "@/prisma/generated/client";
import type { PublishStatus, Locale as PrismaLocale } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

const ARTICLE_AUTHORS_SELECT = {
  orderBy: { position: "asc" as const },
  select: { author: { select: { id: true, name: true } } },
};

// Exported — server/queries/authors.ts (author profile's article list) and
// server/queries/search.ts (combined search results) hydrate the same card
// shape from a different `where`, and must stay in lockstep with it.
export const ARTICLE_PUBLIC_SELECT = {
  id: true,
  slug: true,
  title: true,
  subtitle: true,
  excerpt: true,
  publishedAt: true,
  readingTime: true,
  article: {
    select: {
      id: true,
      featured: true,
      cover: { select: { publicId: true, blurDataUrl: true, alt: true } },
      authors: ARTICLE_AUTHORS_SELECT,
    },
  },
} as const;

// Admin overview — every locale at once, showing per-locale status, no
// locale param. `search` matches any translation regardless of locale, so
// an admin can find an article by its EN title too.
export async function listArticlesAdmin({
  search,
  status,
  authorId,
  sort,
  page,
}: {
  search?: string;
  status?: PublishStatus;
  authorId?: string;
  sort: "updated_desc" | "updated_asc";
  page: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  const translationFilter: Prisma.ArticleTranslationWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { subtitle: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const where: Prisma.ArticleWhereInput = {
    ...(authorId ? { authors: { some: { authorId } } } : {}),
    ...(Object.keys(translationFilter).length > 0 ? { translations: { some: translationFilter } } : {}),
  };

  const [items, total] = await Promise.all([
    db.article.findMany({
      where,
      orderBy: { updatedAt: sort === "updated_asc" ? "asc" : "desc" },
      skip: (page - 1) * ARTICLES_PAGE_SIZE,
      take: ARTICLES_PAGE_SIZE,
      select: {
        id: true,
        featured: true,
        updatedAt: true,
        cover: { select: { publicId: true, blurDataUrl: true } },
        authors: ARTICLE_AUTHORS_SELECT,
        translations: {
          select: { id: true, locale: true, status: true, title: true, slug: true, publishedAt: true, updatedAt: true },
        },
      },
    }),
    db.article.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ARTICLES_PAGE_SIZE)) };
}

// Full record for the tab UI — all translations mounted at once, one round
// trip.
export async function getArticleForEdit(id: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  return db.article.findUnique({
    where: { id },
    include: {
      cover: true,
      authors: { orderBy: { position: "asc" }, include: { author: { include: { photo: true } } } },
      tags: { include: { tag: true } },
      translations: true,
    },
  });
}

// Independent publication — never falls back to another locale. A miss here
// is resolved by getArticleTranslationBySlugAnyLocale at the route layer
// (307 to a locale that has it), never a fallback render.
export async function getArticleBySlugForPublic(locale: LocaleCode, slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles, TAGS.articleList(locale), TAGS.article(locale, slug));

  const translation = await db.articleTranslation.findFirst({
    where: { locale: toDbLocale(locale), slug, status: "PUBLISHED" },
    include: {
      article: {
        include: {
          cover: true,
          authors: { orderBy: { position: "asc" }, include: { author: { include: { photo: true } } } },
          tags: { include: { tag: true } },
        },
      },
    },
  });
  if (!translation) return null;
  // `id` on the result is the Article's id (what admin routes and preview
  // links are keyed by); the translation row's own id — needed by
  // update/publish actions and the optimistic-concurrency check — comes
  // back as `translationId`. `updatedAt`/`createdAt` resolve to the
  // translation's own values (the meaningful "last modified" for rendered
  // content), not the parent's bookkeeping timestamp.
  const { id: translationId, article, ...rest } = translation;
  return { ...article, ...rest, translationId };
}

// Backs the article-page language switcher — offers only the locales it
// exists in, not every locale unconditionally like the structural-page
// switcher does.
export async function getPublishedLocalesForArticle(articleId: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  const rows = await db.articleTranslation.findMany({
    where: { articleId, status: "PUBLISHED" },
    select: { locale: true, slug: true },
  });
  return rows.map((row) => ({ locale: fromDbLocale(row.locale), slug: row.slug }));
}

// Cross-locale lookup backing the "direct link to a locale that doesn't have
// this article redirects to one that does, preferring French" rule. Only
// PUBLISHED translations count — never reveal a draft's existence in
// another locale (the "never confirm draft existence" rule applies just as
// much across locales as within one).
const LOCALE_PRIORITY: PrismaLocale[] = ["FR", "EN", "AR"];

export async function getArticleTranslationBySlugAnyLocale(slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  const matches = await db.articleTranslation.findMany({
    where: { slug, status: "PUBLISHED" },
    select: { locale: true, slug: true },
  });
  if (matches.length === 0) return null;

  const best = LOCALE_PRIORITY.map((locale) => matches.find((m) => m.locale === locale)).find(
    (m): m is (typeof matches)[number] => m != null,
  );
  return best ? { locale: fromDbLocale(best.locale), slug: best.slug } : null;
}

// Backs articles/[slug]/page.tsx's generateStaticParams. Cache Components
// requires every generateStaticParams to return at least one result (an
// empty array is a build error — EmptyGenerateStaticParamsError — since
// Next needs at least one concrete value to validate the segment's dynamic
// accesses against); the page treats a placeholder slug as a normal
// not-found, so it's harmless if a locale genuinely has zero published
// articles yet.
export async function listPublishedSlugsForStaticParams(locale: LocaleCode): Promise<string[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale));

  const rows = await db.articleTranslation.findMany({
    where: { locale: toDbLocale(locale), status: "PUBLISHED" },
    select: { slug: true },
  });
  return rows.length > 0 ? rows.map((row) => row.slug) : ["__none__"];
}

// Public index / tag filter / search — PUBLISHED only, one locale.
export async function listArticlesPublic({
  locale,
  search,
  tag,
  page,
}: {
  locale: LocaleCode;
  search?: string;
  tag?: string;
  page: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale));

  const trimmedSearch = search?.trim();
  const skip = (page - 1) * ARTICLES_PAGE_SIZE;

  if (trimmedSearch) {
    return listArticlesPublicBySearch({ locale, search: trimmedSearch, tag, page, skip });
  }

  const where: Prisma.ArticleTranslationWhereInput = {
    locale: toDbLocale(locale),
    status: "PUBLISHED",
    ...(tag ? { article: { tags: { some: { tag: { slug: tag } } } } } : {}),
  };

  const [items, total] = await Promise.all([
    db.articleTranslation.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip,
      take: ARTICLES_PAGE_SIZE,
      select: ARTICLE_PUBLIC_SELECT,
    }),
    db.articleTranslation.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ARTICLES_PAGE_SIZE)) };
}

// Home page teaser — the 3 most recent published articles for the active
// locale, independent per locale like every other publication read (no
// fallback to another locale's articles).
export async function listLatestArticlesPublic(locale: LocaleCode, limit = 3) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale));

  return db.articleTranslation.findMany({
    where: { locale: toDbLocale(locale), status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: ARTICLE_PUBLIC_SELECT,
  });
}

// Free-text search — queries the per-locale `search_vector` tsvector column
// (populated by a DB trigger, prisma/migrations/20260806140100_localisation_raw_sql)
// via `websearch_to_tsquery`, which understands the same syntax as a search
// engine box ("quoted phrases", -exclusion, OR) rather than a plain
// substring match. Ranked by ts_rank — relevance, not publish date, is what
// a search-results page should optimize for.
//
// Two round trips because Prisma's query builder has no `@@`/`ts_rank`
// escape hatch: the first raw query resolves matching translation ids (+
// total count) with locale/status/tag filtering and pagination done in SQL;
// the second re-fetches those exact ids through the normal typed Prisma
// query so the returned shape is identical to the non-search branch above.
// `WHERE id IN (...)` doesn't preserve order, so the rows are re-sorted in
// JS back into rank order afterwards.
async function listArticlesPublicBySearch({
  locale,
  search,
  tag,
  page,
  skip,
}: {
  locale: LocaleCode;
  search: string;
  tag?: string;
  page: number;
  skip: number;
}) {
  const dbLocale = toDbLocale(locale);
  const config = TS_SEARCH_CONFIG[locale];
  const tagJoin = tag
    ? Prisma.sql`JOIN "ArticleTag" atag ON atag."articleId" = at."articleId" JOIN "Tag" t ON t.id = atag."tagId" AND t.slug = ${tag}`
    : Prisma.empty;

  const [ranked, countRows] = await Promise.all([
    db.$queryRaw<{ id: string }[]>`
      SELECT at.id
      FROM "ArticleTranslation" at
      ${tagJoin}
      WHERE at.locale = ${dbLocale}::"Locale"
        AND at.status = 'PUBLISHED'
        AND at.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${search})
      ORDER BY ts_rank(at.search_vector, websearch_to_tsquery(${config}::regconfig, ${search})) DESC,
               at."publishedAt" DESC
      LIMIT ${ARTICLES_PAGE_SIZE} OFFSET ${skip}
    `,
    db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count
      FROM "ArticleTranslation" at
      ${tagJoin}
      WHERE at.locale = ${dbLocale}::"Locale"
        AND at.status = 'PUBLISHED'
        AND at.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${search})
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / ARTICLES_PAGE_SIZE));
  const ids = ranked.map((row) => row.id);
  if (ids.length === 0) return { items: [], total, page, pageCount };

  const rows = await db.articleTranslation.findMany({
    where: { id: { in: ids } },
    select: ARTICLE_PUBLIC_SELECT,
  });
  const rank = new Map(ids.map((id, index) => [id, index]));
  const items = rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));

  return { items, total, page, pageCount };
}

// Backs app/sitemap.ts. Flat list, grouped by articleId at the call site —
// sitemap.ts needs each translation's sibling locales to build reciprocal
// hreflang alternates, so a single query beats one per article.
export async function listPublishedArticleTranslationsForSitemap() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  return db.articleTranslation.findMany({
    where: { status: "PUBLISHED" },
    select: { articleId: true, locale: true, slug: true, updatedAt: true },
  });
}

// Public tag filter — only tags actually carried by a published article in
// this locale, never the admin's full Tag table (listTags()), which would
// surface a tag whose only articles are drafts or published in a different
// locale.
export async function listArticleTagsForPublic(locale: LocaleCode) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale));

  return db.tag.findMany({
    where: { articles: { some: { article: { translations: { some: { locale: toDbLocale(locale), status: "PUBLISHED" } } } } } },
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, name: true },
  });
}

const RELATED_ARTICLE_SELECT = {
  ...ARTICLE_PUBLIC_SELECT,
  article: { select: { ...ARTICLE_PUBLIC_SELECT.article.select, tags: { select: { tagId: true } } } },
} as const;

// Shared tags first, then recency — one query for the tag-overlap pool,
// ranked in JS by how many tags it shares with the current article, with a
// second recency-only query filling any remainder (an article with no
// tags, or fewer than `limit` tagged siblings).
export async function listRelatedArticlesPublic({
  locale,
  articleId,
  tagIds,
  limit = 3,
}: {
  locale: LocaleCode;
  articleId: string;
  tagIds: string[];
  limit?: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale));

  const dbLocale = toDbLocale(locale);

  const pool =
    tagIds.length > 0
      ? await db.articleTranslation.findMany({
          where: {
            locale: dbLocale,
            status: "PUBLISHED",
            article: { id: { not: articleId }, tags: { some: { tagId: { in: tagIds } } } },
          },
          orderBy: { publishedAt: "desc" },
          take: limit * 5,
          select: RELATED_ARTICLE_SELECT,
        })
      : [];

  const ranked = [...pool].sort((a, b) => {
    const sharedA = a.article.tags.filter((t) => tagIds.includes(t.tagId)).length;
    const sharedB = b.article.tags.filter((t) => tagIds.includes(t.tagId)).length;
    if (sharedB !== sharedA) return sharedB - sharedA;
    return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0);
  });

  const related = ranked.slice(0, limit).map((row) => ({
    ...row,
    article: { id: row.article.id, featured: row.article.featured, cover: row.article.cover, authors: row.article.authors },
  }));

  if (related.length >= limit) return related;

  const excludeArticleIds = [articleId, ...related.map((r) => r.article.id)];
  const fill = await db.articleTranslation.findMany({
    where: { locale: dbLocale, status: "PUBLISHED", article: { id: { notIn: excludeArticleIds } } },
    orderBy: { publishedAt: "desc" },
    take: limit - related.length,
    select: ARTICLE_PUBLIC_SELECT,
  });

  return [...related, ...fill];
}

// Bypasses the cache entirely — draft preview must never read a stale or
// public-cached copy. Locale-scoped: a preview of a translation that was
// never written returns null.
export async function getArticleForPreview(id: string, locale: LocaleCode) {
  const translation = await db.articleTranslation.findUnique({
    where: { articleId_locale: { articleId: id, locale: toDbLocale(locale) } },
    include: {
      article: {
        include: {
          cover: true,
          authors: { orderBy: { position: "asc" }, include: { author: { include: { photo: true } } } },
          tags: { include: { tag: true } },
        },
      },
    },
  });
  if (!translation) return null;
  const { id: translationId, article, ...rest } = translation;
  return { ...article, ...rest, translationId };
}
