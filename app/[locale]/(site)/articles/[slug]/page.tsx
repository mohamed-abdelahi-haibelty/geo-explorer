import NextLink from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ArticlePdfLink } from "@/components/site/article-pdf-link";
import {
  getArticleBySlugForPublic,
  getArticleTranslationBySlugAnyLocale,
  getPublishedLocalesForArticle,
  listPublishedSlugsForStaticParams,
} from "@/server/queries/articles";
import { pickLocalizedText } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";

// A plain locale dictionary, not getTranslations()/messages/*.json: this
// page deliberately stays outside <Suspense> (see the note on the default
// export below) so redirect()/notFound() can set a real HTTP status, and
// next-intl's server APIs need the same runtime-data Suspense boundary
// everything else in this file was rewritten to avoid.
const READING_TIME_LABEL: Record<LocaleCode, (minutes: number) => string> = {
  fr: (minutes) => `${minutes} min de lecture`,
  en: (minutes) => `${minutes} min read`,
  ar: (minutes) => `${minutes} دقيقة قراءة`,
};

const BACK_LABEL: Record<LocaleCode, string> = {
  fr: "Retour aux articles",
  en: "Back to articles",
  ar: "العودة إلى المقالات",
};

const PDF_LABEL: Record<LocaleCode, string> = {
  fr: "Étude complète (PDF)",
  en: "Full study (PDF)",
  ar: "الدراسة الكاملة (PDF)",
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

  // Independent publication, never a fallback render (Task 04a): a miss
  // here means either this locale never had a translation, or it exists but
  // isn't published — either way, redirect to a locale that actually has
  // it (FR-preferred), or a genuine 404 if no locale does.
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
  // an entry for a locale this article isn't published in (Task 04a step
  // 12), reciprocal by construction since every locale's own generateMetadata
  // runs this same query. x-default points at French, the fallback locale.
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
// (Task 04a) requires an actual 307, so this route stays outside Suspense —
// all pages are dynamic by default under Cache Components, so this doesn't
// need force-dynamic or similar; it just can't defer into a Suspense child.
export default async function ArticleDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const article = await loadArticle(typedLocale, slug);
  const availableLocales = await getPublishedLocalesForArticle(article.articleId);

  const BackIcon = typedLocale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <NextLink
        href={`/${typedLocale}/articles`}
        className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground"
      >
        <BackIcon aria-hidden="true" className="size-3.5" />
        {BACK_LABEL[typedLocale]}
      </NextLink>

      {availableLocales.length > 1 && (
        <nav className="flex gap-3 font-mono text-xs text-muted-foreground">
          {/* Plain next/link — see the identical note in (site)/layout.tsx's
              switcher on why next-intl's Link isn't used for cross-locale hrefs. */}
          {availableLocales.map((entry) => (
            <NextLink
              key={entry.locale}
              href={`/${entry.locale}/articles/${entry.slug}`}
              aria-current={entry.locale === typedLocale ? "true" : undefined}
              className={entry.locale === typedLocale ? "font-semibold text-foreground" : "hover:text-foreground"}
            >
              {entry.locale.toUpperCase()}
            </NextLink>
          ))}
        </nav>
      )}

      {article.cover && (
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          <CldImage
            publicId={article.cover.publicId}
            alt={pickLocalizedText(article.cover.alt, typedLocale)}
            fill
            sizes="672px"
            blurDataUrl={article.cover.blurDataUrl}
          />
        </div>
      )}

      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl text-foreground">{article.title}</h1>
        {article.subtitle && <p className="text-lg text-muted-foreground">{article.subtitle}</p>}
        <p className="font-mono text-xs text-muted-foreground">
          {article.authors.map((row) => row.author.name).join(", ") || "—"} ·{" "}
          {READING_TIME_LABEL[typedLocale](article.readingTime)}
        </p>
        {article.pdfUrl && <ArticlePdfLink url={article.pdfUrl} label={PDF_LABEL[typedLocale]} />}
      </header>

      {/* contentHtml is sanitized server-side at save time (server/services/content.ts) */}
      <div className="article-content max-w-none" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

      {article.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {article.tags.map(({ tag }) => (
            <li key={tag.id}>
              <NextLink
                href={`/${typedLocale}/articles/tag/${tag.slug}`}
                className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                {pickLocalizedText(tag.name, typedLocale)}
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
