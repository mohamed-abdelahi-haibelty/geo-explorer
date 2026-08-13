import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { ARTICLE_PUBLIC_SELECT } from "@/server/queries/articles";
import { ARTICLES_PAGE_SIZE } from "@/lib/validation/articles";
import { toDbLocale, fromDbLocale } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";

// Small table (a handful of researchers), read in full everywhere it's
// needed — the admin list and the article form's author picker.
export async function listAuthors() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors);

  return db.author.findMany({
    orderBy: { name: "asc" },
    include: { photo: true, _count: { select: { articles: true } } },
  });
}

export async function getAuthorById(id: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors);

  return db.author.findUnique({ where: { id }, include: { photo: true } });
}

// Depends on ArticleAuthor rows, which only ever change alongside an
// article write — tagging both keeps this fresh without a dedicated tag.
export async function getAuthorArticleCount(id: string): Promise<number> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors, TAGS.articles);

  return db.articleAuthor.count({ where: { authorId: id } });
}

// Public profile — Author has no locale/published flag of its own
// (structural, like Service — see lib/locale.ts's resolveStructural note),
// so a slug either exists or it doesn't; the redirect-first decision
// at the route layer is "does this author exist at all", never a per-locale
// concern. title/bio still need pickLocalizedText at the call site since
// they're LocalizedText JSON.
export async function getAuthorBySlugForPublic(slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors);

  return db.author.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      title: true,
      bio: true,
      email: true,
      linkedin: true,
      photo: { select: { publicId: true, blurDataUrl: true, alt: true } },
    },
  });
}

// Paginated, locale-scoped (unlike the profile itself) — an author's article
// list is a view over Article publications, which are independent per
// locale like everywhere else on the public site.
export async function listArticlesByAuthorPublic({
  locale,
  authorId,
  page,
}: {
  locale: LocaleCode;
  authorId: string;
  page: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors, TAGS.articleList(locale));

  const where = {
    locale: toDbLocale(locale),
    status: "PUBLISHED" as const,
    article: { authors: { some: { authorId } } },
  };

  const [items, total] = await Promise.all([
    db.articleTranslation.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * ARTICLES_PAGE_SIZE,
      take: ARTICLES_PAGE_SIZE,
      select: ARTICLE_PUBLIC_SELECT,
    }),
    db.articleTranslation.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / ARTICLES_PAGE_SIZE)) };
}

// Backs auteurs/[slug]/page.tsx's generateStaticParams — only authors with
// at least one published article in this locale (an author with a bio but no
// published work yet still resolves on demand via dynamicParams, just isn't
// pre-rendered — same relationship services/[slug] has to
// listPublishedServiceSlugsForStaticParams).
export async function listPublishedAuthorSlugsForStaticParams(locale: LocaleCode): Promise<string[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors, TAGS.articleList(locale));

  const rows = await db.author.findMany({
    where: { articles: { some: { article: { translations: { some: { locale: toDbLocale(locale), status: "PUBLISHED" } } } } } },
    select: { slug: true },
  });
  return rows.length > 0 ? rows.map((row) => row.slug) : ["__none__"];
}

// Backs app/sitemap.ts — each author's profile is only ever a real page in
// a locale where they have a published article (same rule
// listPublishedAuthorSlugsForStaticParams applies), so this resolves that
// locale set per author rather than emitting all three unconditionally.
export async function listPublishedAuthorSlugsWithLocalesForSitemap() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors, TAGS.articles);

  const authors = await db.author.findMany({
    where: { articles: { some: { article: { translations: { some: { status: "PUBLISHED" } } } } } },
    select: {
      slug: true,
      updatedAt: true,
      articles: {
        select: { article: { select: { translations: { where: { status: "PUBLISHED" }, select: { locale: true } } } } },
      },
    },
  });

  return authors.map((author) => {
    const locales = new Set<LocaleCode>();
    for (const { article } of author.articles) {
      for (const translation of article.translations) locales.add(fromDbLocale(translation.locale));
    }
    return { slug: author.slug, locales: Array.from(locales), updatedAt: author.updatedAt };
  });
}
