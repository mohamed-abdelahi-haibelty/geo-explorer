import { Suspense } from "react";
import NextLink from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ExternalLink, Mail } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ArticleCard } from "@/components/site/article-card";
import { PaginationNav } from "@/components/site/pagination-nav";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import {
  getAuthorBySlugForPublic,
  listArticlesByAuthorPublic,
  listPublishedAuthorSlugsForStaticParams,
} from "@/server/queries/authors";
import { pickLocalizedText } from "@/lib/locale";
import { noindexIfFallback } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import { buildBreadcrumbSchema, jsonLdGraph, BREADCRUMB_LABELS } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import type { LocaleCode } from "@/lib/validation/locale";

// Same redirect-first shape as services/[slug] (constraint 2's pattern):
// an unknown author slug sends the visitor to the articles index rather
// than notFound()-ing outside <Suspense> (see that file's long note on why
// notFound() crashes `next start` here under Cache Components). Author has
// no locale/published flag of its own — see
// server/queries/authors.ts's getAuthorBySlugForPublic note — so this is
// only ever "does this author exist at all", never a per-locale concern.
const DICT: Record<
  LocaleCode,
  { back: string; articlesHeading: string; empty: string; email: string; linkedin: string; readingTime: (minutes: number) => string; previous: string; next: string }
> = {
  fr: {
    back: "Tous les articles",
    articlesHeading: "Articles publiés",
    empty: "Aucun article publié dans cette langue pour l'instant.",
    email: "E-mail",
    linkedin: "LinkedIn",
    readingTime: (m) => `${m} min de lecture`,
    previous: "Précédent",
    next: "Suivant",
  },
  en: {
    back: "All articles",
    articlesHeading: "Published articles",
    empty: "No article published in this language yet.",
    email: "Email",
    linkedin: "LinkedIn",
    readingTime: (m) => `${m} min read`,
    previous: "Previous",
    next: "Next",
  },
  ar: {
    back: "جميع المقالات",
    articlesHeading: "المقالات المنشورة",
    empty: "لا توجد مقالات منشورة بهذه اللغة بعد.",
    email: "البريد الإلكتروني",
    linkedin: "LinkedIn",
    readingTime: (m) => `${m} دقيقة قراءة`,
    previous: "السابق",
    next: "التالي",
  },
};

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

// Only authors with at least one published article in this locale are
// pre-rendered (listPublishedAuthorSlugsForStaticParams); dynamicParams
// stays at its default (true), so a bio-only author still resolves on
// demand, just without SSG.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await listPublishedAuthorSlugsForStaticParams(params.locale as LocaleCode);
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const author = await getAuthorBySlugForPublic(slug);
  if (!author) return {};

  const hasOwnTitle = pickLocalizedText(author.title, typedLocale, { fallback: false }) !== "";
  const hasOwnBio = pickLocalizedText(author.bio, typedLocale, { fallback: false }) !== "";
  const title = pickLocalizedText(author.title, typedLocale);

  return {
    title: title ? `${author.name} — ${title}` : author.name,
    description: pickLocalizedText(author.bio, typedLocale) || undefined,
    alternates: { canonical: `/${locale}/auteurs/${slug}` },
    robots: noindexIfFallback(typedLocale, !hasOwnTitle && !hasOwnBio),
  };
}

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

// The redirect-needing author lookup stays outside <Suspense>, matching
// articles/[slug] and services/[slug] (redirect() inside a streamed
// boundary degrades to a client-side meta-refresh instead of a real HTTP
// 307). But unlike those two, this page also has a `?page=` search param for
// the article grid — genuinely uncached, dynamic data Cache Components
// requires inside its own <Suspense> boundary. So the two constraints are
// split across two components: this one resolves `params` only (statically
// enumerable via generateStaticParams) and can redirect synchronously; the
// paginated grid below reads `searchParams` inside its own nested Suspense.
export default async function AuthorProfilePage({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const t = DICT[typedLocale];
  const isRtl = typedLocale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const author = await getAuthorBySlugForPublic(slug);
  if (!author) redirect(`/${typedLocale}/articles`);

  const title = pickLocalizedText(author.title, typedLocale);
  const bio = pickLocalizedText(author.bio, typedLocale);

  const siteUrl = (await getSiteUrl()).replace(/\/$/, "");
  const breadcrumbLabels = BREADCRUMB_LABELS[typedLocale];
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: breadcrumbLabels.home, url: `${siteUrl}/${typedLocale}` },
    { name: breadcrumbLabels.auteurs, url: `${siteUrl}/${typedLocale}/articles` },
    { name: author.name, url: `${siteUrl}/${typedLocale}/auteurs/${slug}` },
  ]);

  return (
    <>
      <JsonLd data={jsonLdGraph([breadcrumbSchema])} />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20">
          <NextLink
            href={`/${typedLocale}/articles`}
            className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon aria-hidden="true" className="size-3.5" />
            {t.back}
          </NextLink>

          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {author.photo ? (
              <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-muted">
                <CldImage publicId={author.photo.publicId} alt="" fill sizes="96px" blurDataUrl={author.photo.blurDataUrl} />
              </div>
            ) : (
              <span className="flex size-24 shrink-0 items-center justify-center rounded-full bg-secondary font-heading text-2xl text-secondary-foreground">
                {initials(author.name)}
              </span>
            )}
            <div className="flex flex-col gap-1.5">
              <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{author.name}</h1>
              {title && <p className="font-mono text-sm text-muted-foreground">{title}</p>}
              <div className="mt-1 flex flex-wrap gap-4 font-mono text-xs text-secondary">
                {author.email && (
                  <a href={`mailto:${author.email}`} className="flex items-center gap-1.5 hover:text-primary">
                    <Mail aria-hidden="true" className="size-3.5" />
                    {t.email}
                  </a>
                )}
                {author.linkedin && (
                  <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                    {t.linkedin}
                  </a>
                )}
              </div>
            </div>
          </div>

          {bio && <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">{bio}</p>}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="mb-10 font-heading text-2xl font-semibold text-foreground">{t.articlesHeading}</h2>
        <Suspense>
          <AuthorArticles authorId={author.id} slug={slug} locale={typedLocale} searchParams={searchParams} dict={t} />
        </Suspense>
      </section>
    </>
  );
}

async function AuthorArticles({
  authorId,
  slug,
  locale,
  searchParams,
  dict,
}: {
  authorId: string;
  slug: string;
  locale: LocaleCode;
  searchParams: PageProps["searchParams"];
  dict: (typeof DICT)[LocaleCode];
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { items, pageCount } = await listArticlesByAuthorPublic({ locale, authorId, page });

  return (
    <>
      {items.length === 0 ? (
        <p className="text-muted-foreground">{dict.empty}</p>
      ) : (
        <ScrollRevealGroup className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((article) => (
            <ArticleCard key={article.slug} article={article} locale={locale} readingTimeLabel={dict.readingTime} />
          ))}
        </ScrollRevealGroup>
      )}

      <div className="mt-14">
        <PaginationNav
          locale={locale}
          basePath={`/${locale}/auteurs/${slug}`}
          page={page}
          pageCount={pageCount}
          prevLabel={dict.previous}
          nextLabel={dict.next}
        />
      </div>
    </>
  );
}
