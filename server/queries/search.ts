import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { toDbLocale } from "@/lib/locale";
import { TS_SEARCH_CONFIG } from "@/lib/search-config";
import { ARTICLES_PAGE_SIZE } from "@/lib/validation/articles";
import { ARTICLE_PUBLIC_SELECT } from "@/server/queries/articles";
import { NEWS_LIST_SELECT } from "@/server/queries/news";
import type { Prisma } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

const SEARCH_PAGE_SIZE = ARTICLES_PAGE_SIZE;

type HitRow = { id: string; kind: "article" | "news" };

// One ranked pool across both tsvector columns via UNION ALL, rather than
// two separate ranked queries merged client-side — ts_rank scores aren't
// comparable across a paginated split, so the ORDER BY/LIMIT/OFFSET has to
// happen against the combined set in SQL, exactly like
// listArticlesPublicBySearch does for a single table.
async function rankedSearchHits({
  locale,
  query,
  page,
}: {
  locale: LocaleCode;
  query: string;
  page: number;
}): Promise<{ ranked: HitRow[]; total: number }> {
  const dbLocale = toDbLocale(locale);
  const config = TS_SEARCH_CONFIG[locale];
  const skip = (page - 1) * SEARCH_PAGE_SIZE;

  const [ranked, countRows] = await Promise.all([
    db.$queryRaw<HitRow[]>`
      WITH hits AS (
        SELECT at.id, 'article'::text AS kind,
               ts_rank(at.search_vector, websearch_to_tsquery(${config}::regconfig, ${query})) AS rank,
               at."publishedAt" AS published_at
        FROM "ArticleTranslation" at
        WHERE at.locale = ${dbLocale}::"Locale" AND at.status = 'PUBLISHED'
          AND at.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${query})
        UNION ALL
        SELECT nt.id, 'news'::text AS kind,
               ts_rank(nt.search_vector, websearch_to_tsquery(${config}::regconfig, ${query})) AS rank,
               nt."publishedAt" AS published_at
        FROM "NewsTranslation" nt
        WHERE nt.locale = ${dbLocale}::"Locale" AND nt.status = 'PUBLISHED'
          AND nt.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${query})
      )
      SELECT id, kind FROM hits ORDER BY rank DESC, published_at DESC LIMIT ${SEARCH_PAGE_SIZE} OFFSET ${skip}
    `,
    db.$queryRaw<{ count: bigint }[]>`
      WITH hits AS (
        SELECT at.id
        FROM "ArticleTranslation" at
        WHERE at.locale = ${dbLocale}::"Locale" AND at.status = 'PUBLISHED'
          AND at.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${query})
        UNION ALL
        SELECT nt.id
        FROM "NewsTranslation" nt
        WHERE nt.locale = ${dbLocale}::"Locale" AND nt.status = 'PUBLISHED'
          AND nt.search_vector @@ websearch_to_tsquery(${config}::regconfig, ${query})
      )
      SELECT COUNT(*) AS count FROM hits
    `,
  ]);

  return { ranked, total: Number(countRows[0]?.count ?? 0) };
}

export type ArticleSearchHit = { kind: "article"; item: Prisma.ArticleTranslationGetPayload<{ select: typeof ARTICLE_PUBLIC_SELECT }> };
export type NewsSearchHit = { kind: "news"; item: Prisma.NewsTranslationGetPayload<{ select: typeof NEWS_LIST_SELECT }> };
export type SearchHit = ArticleSearchHit | NewsSearchHit;

// Backs recherche/page.tsx — articles and news ranked together, each
// result carrying its own `kind` so the page can route and label it
// correctly, indicating which type each hit is.
export async function searchPublic({
  locale,
  query,
  page,
}: {
  locale: LocaleCode;
  query: string;
  page: number;
}): Promise<{ items: SearchHit[]; total: number; page: number; pageCount: number }> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articleList(locale), TAGS.newsList(locale));

  const trimmed = query.trim();
  if (!trimmed) return { items: [], total: 0, page, pageCount: 1 };

  const { ranked, total } = await rankedSearchHits({ locale, query: trimmed, page });
  const pageCount = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  if (ranked.length === 0) return { items: [], total, page, pageCount };

  const articleIds = ranked.filter((row) => row.kind === "article").map((row) => row.id);
  const newsIds = ranked.filter((row) => row.kind === "news").map((row) => row.id);

  const [articles, news] = await Promise.all([
    articleIds.length > 0
      ? db.articleTranslation.findMany({ where: { id: { in: articleIds } }, select: ARTICLE_PUBLIC_SELECT })
      : Promise.resolve([]),
    newsIds.length > 0
      ? db.newsTranslation.findMany({ where: { id: { in: newsIds } }, select: NEWS_LIST_SELECT })
      : Promise.resolve([]),
  ]);

  const articleById = new Map(articles.map((row) => [row.id, row]));
  const newsById = new Map(news.map((row) => [row.id, row]));

  // `WHERE id IN (...)` doesn't preserve order — re-thread through `ranked`
  // to restore rank order, same fix-up listArticlesPublicBySearch applies.
  const items: SearchHit[] = [];
  for (const row of ranked) {
    if (row.kind === "article") {
      const item = articleById.get(row.id);
      if (item) items.push({ kind: "article", item });
    } else {
      const item = newsById.get(row.id);
      if (item) items.push({ kind: "news", item });
    }
  }

  return { items, total, page, pageCount };
}
