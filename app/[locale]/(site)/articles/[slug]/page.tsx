import NextLink from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ArticlePdfLink } from "@/components/site/article-pdf-link";
import { AuthorBlock } from "@/components/site/author-block";
import { TocNav } from "@/components/site/toc-nav";
import { ArticleCard } from "@/components/site/article-card";
import { ViewCounter } from "@/components/site/view-counter";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import {
  getArticleBySlugForPublic,
  getArticleTranslationBySlugAnyLocale,
  getPublishedLocalesForArticle,
  listPublishedSlugsForStaticParams,
  listRelatedArticlesPublic,
} from "@/server/queries/articles";
import { pickLocalizedText } from "@/lib/locale";
import { formatDate } from "@/lib/format-date";
import { formatFileSize } from "@/lib/format-bytes";
import { extractHeadings } from "@/lib/toc";
import { getSiteUrl } from "@/lib/site-url";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { buildArticleSchema, buildBreadcrumbSchema, jsonLdGraph, BREADCRUMB_LABELS } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import type { LocaleCode } from "@/lib/validation/locale";

// A plain locale dictionary, not getTranslations()/messages/*.json: this
// page deliberately stays outside <Suspense> (see the note on the default
// export below) so redirect()/notFound() can set a real HTTP status, and
// next-intl's server APIs need the same runtime-data Suspense boundary
// everything else in this file was rewritten to avoid.
const DICT: Record<
  LocaleCode,
  {
    back: string;
    readingTime: (minutes: number) => string;
    pdf: (size: string) => string;
    toc: string;
    related: string;
  }
> = {
  fr: {
    back: "Retour aux articles",
    readingTime: (m) => `${m} min de lecture`,
    pdf: (size) => `Étude complète (PDF · ${size})`,
    toc: "Sommaire",
    related: "À lire aussi",
  },
  en: {
    back: "Back to articles",
    readingTime: (m) => `${m} min read`,
    pdf: (size) => `Full study (PDF · ${size})`,
    toc: "Contents",
    related: "Related reading",
  },
  ar: {
    back: "العودة إلى المقالات",
    readingTime: (m) => `${m} دقيقة قراءة`,
    pdf: (size) => `الدراسة الكاملة (PDF · ${size})`,
    toc: "المحتويات",
    related: "مقالات ذات صلة",
  },
};

// Real published slugs, not an empty/dummy list — Cache Components requires
// generateStaticParams to return at least one result per parent-enumerated
// [locale] (an empty array is a build error), and enumerating real slugs
// here also gets genuine SSG for the common case, not just build-safety.
// This is also what lets `params` be read directly below without a
// <Suspense> wrapper — needed so the redirect()/notFound() calls in
// loadArticle can set a real HTTP status (see the note on the page below).
// dynamicParams stays at its default (true), so any slug not in this list
// (including new articles published after the last build) still renders
// on demand.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await listPublishedSlugsForStaticParams(params.locale as LocaleCode);
  return slugs.map((slug) => ({ slug }));
}

async function loadArticle(locale: LocaleCode, slug: string) {
  const article = await getArticleBySlugForPublic(locale, slug);
  if (article) return article;

  // Independent publication, never a fallback render: a miss here means
  // either this locale never had a translation, or it exists but isn't
  // published — either way, redirect to a locale that actually has it
  // (FR-preferred), or a genuine 404 if no locale does.
  const fallback = await getArticleTranslationBySlugAnyLocale(slug);
  if (fallback) redirect(`/${fallback.locale}/articles/${fallback.slug}`);
  notFound();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const article = await getArticleBySlugForPublic(locale as LocaleCode, slug);
  if (!article) return {};

  // hreflang built from the article's actual published-locale set — never
  // an entry for a locale this article isn't published in, reciprocal by
  // construction since every locale's own generateMetadata runs this same
  // query. x-default points at French, the fallback locale.
  const availableLocales = await getPublishedLocalesForArticle(article.articleId);
  const languages = Object.fromEntries(availableLocales.map((entry) => [entry.locale, `/${entry.locale}/articles/${entry.slug}`]));
  const frEntry = availableLocales.find((entry) => entry.locale === "fr");

  return {
    title: article.metaTitle || article.title,
    description: article.metaDescription || article.excerpt || undefined,
    alternates: {
      canonical: `/${locale}/articles/${slug}`,
      languages: frEntry ? { ...languages, "x-default": `/fr/articles/${frEntry.slug}` } : languages,
    },
  };
}

type PageProps = { params: Promise<{ locale: string; slug: string }> };

// Deliberately NOT Suspense-wrapped: redirect()/notFound() called from
// inside a streamed Suspense boundary degrade to a client-side meta-refresh
// instead of a real HTTP 307/404 (see next/navigation's redirect() docs —
// "when used in a streaming context, this will insert a meta tag to emit
// the redirect on the client side"). The publications-independence rule
// requires an actual 307, so this route stays outside Suspense —
// all pages are dynamic by default under Cache Components, so this doesn't
// need force-dynamic or similar; it just can't defer into a Suspense child.
export default async function ArticleDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const t = DICT[typedLocale];
  const isRtl = typedLocale === "ar";
  const article = await loadArticle(typedLocale, slug);

  const tagIds = article.tags.map(({ tag }) => tag.id);
  const [related, siteUrl] = await Promise.all([
    listRelatedArticlesPublic({ locale: typedLocale, articleId: article.articleId, tagIds }),
    getSiteUrl(),
  ]);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const headings = extractHeadings(article.contentHtml);
  const trimmedSiteUrl = siteUrl.replace(/\/$/, "");
  const canonicalUrl = `${trimmedSiteUrl}/${typedLocale}/articles/${slug}`;
  const breadcrumbLabels = BREADCRUMB_LABELS[typedLocale];
  const articleSchema = buildArticleSchema({
    siteUrl: trimmedSiteUrl,
    url: canonicalUrl,
    headline: article.title,
    description: article.metaDescription || article.excerpt,
    imageUrl: article.cover ? cloudinaryImageUrl(article.cover.publicId, { width: 1200 }) : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    authorNames: article.authors.map(({ author }) => author.name),
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: breadcrumbLabels.home, url: `${trimmedSiteUrl}/${typedLocale}` },
    { name: breadcrumbLabels.articles, url: `${trimmedSiteUrl}/${typedLocale}/articles` },
    { name: article.title, url: canonicalUrl },
  ]);

  return (
    <article className="flex flex-col gap-12 pb-20">
      <JsonLd data={jsonLdGraph([articleSchema, breadcrumbSchema])} />
      <ViewCounter articleId={article.articleId} />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-10 pb-12 sm:px-6">
          {/* No per-article locale switcher here — the header's LanguageSwitcher
              is the single place language is changed. generateMetadata still
              emits the hreflang alternates for the translations that exist. */}
          <NextLink
            href={`/${typedLocale}/articles`}
            className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon aria-hidden="true" className="size-3.5" />
            {t.back}
          </NextLink>

          <div className="flex flex-col gap-3">
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {article.title}
            </h1>
            {article.subtitle && <p className="max-w-2xl text-lg text-muted-foreground">{article.subtitle}</p>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <AuthorBlock authors={article.authors} locale={typedLocale} />
            <p className="font-mono text-xs text-muted-foreground">
              {article.publishedAt && formatDate(article.publishedAt, typedLocale)}
              {article.readingTime ? ` · ${t.readingTime(article.readingTime)}` : ""}
            </p>
          </div>

          <div className="relative aspect-21/9 overflow-hidden rounded-2xl bg-muted">
            {article.cover ? (
              <CldImage
                publicId={article.cover.publicId}
                alt={pickLocalizedText(article.cover.alt, typedLocale)}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                blurDataUrl={article.cover.blurDataUrl}
                className="object-cover"
              />
            ) : (
              <SpectralBandRow variant="quiet" className="flex h-full w-full" />
            )}
          </div>

          {article.pdfUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <ArticlePdfLink url={article.pdfUrl} label={t.pdf(formatFileSize(article.pdfBytes ?? 0, typedLocale))} />
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-4xl gap-10 px-4 sm:px-6 lg:max-w-5xl lg:grid-cols-[1fr_14rem]">
        {/* contentHtml is sanitized server-side at save time (server/services/content.ts).
            Content stays first in DOM order at every breakpoint — mobile stacks it
            above the TOC, the lg: grid places the TOC beside it as a sidebar, and
            neither needs an `order` override to get there. */}
        <div className="article-content max-w-prose" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

        {headings.length > 0 && <TocNav headings={headings} label={t.toc} />}
      </div>

      {article.tags.length > 0 && (
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
          <ul className="flex flex-wrap gap-2">
            {article.tags.map(({ tag }) => (
              <li key={tag.id}>
                <NextLink
                  href={`/${typedLocale}/articles/tag/${tag.slug}`}
                  className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  {pickLocalizedText(tag.name, typedLocale)}
                </NextLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <h2 className="mb-8 font-heading text-2xl font-semibold text-foreground">{t.related}</h2>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
              {related.map((item) => (
                <ArticleCard key={item.slug} article={item} locale={typedLocale} readingTimeLabel={t.readingTime} />
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}
    </article>
  );
}
