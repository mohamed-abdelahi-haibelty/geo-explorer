import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { ArticleCard } from "@/components/site/article-card";
import { PaginationNav } from "@/components/site/pagination-nav";
import { LiveSearchInput } from "@/components/site/live-search-input";
import { listArticlesPublic, listArticleTagsForPublic } from "@/server/queries/articles";
import { pickLocalizedText } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "articleIndex" });
  return { title: t("title"), alternates: { canonical: `/${locale}/articles` } };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>;
};

// `searchParams` isn't statically enumerable — Cache Components requires it
// (and anything downstream of it) inside <Suspense>, same pattern as every
// other searchParams-driven page in (site)/**.
export default function ArticlesIndexPage(props: PageProps) {
  return (
    <Suspense>
      <ArticlesIndexContent {...props} />
    </Suspense>
  );
}

async function ArticlesIndexContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const { page: pageParam, tag, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const query = q?.trim() || undefined;

  const [t, { items, pageCount }, tags] = await Promise.all([
    getTranslations(),
    listArticlesPublic({ locale: typedLocale, page, tag, search: query }),
    listArticleTagsForPublic(typedLocale),
  ]);

  const basePath = `/${typedLocale}/articles`;
  const isFiltered = Boolean(tag || query);

  function tagHref(slug?: string) {
    const params = new URLSearchParams();
    if (slug) params.set("tag", slug);
    if (query) params.set("q", query);
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl text-balance font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {t("articleIndex.title")}
          </h1>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex w-full max-w-sm items-center gap-2">
              <LiveSearchInput
                basePath={basePath}
                tag={tag}
                initialValue={query}
                placeholder={t("articleIndex.searchPlaceholder")}
                label={t("articleIndex.searchLabel")}
              />
            </div>

            {tags.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("articleIndex.tagsLabel")}</p>
                <ul className="flex flex-wrap gap-2">
                  <li>
                    <NextLink
                      href={tagHref()}
                      aria-current={!tag ? "true" : undefined}
                      className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${!tag ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                    >
                      {t("articleIndex.allTags")}
                    </NextLink>
                  </li>
                  {tags.map((item) => (
                    <li key={item.id}>
                      <NextLink
                        href={tagHref(item.slug)}
                        aria-current={tag === item.slug ? "true" : undefined}
                        className={`rounded-full px-3 py-1.5 font-mono text-xs transition-colors ${tag === item.slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                      >
                        {pickLocalizedText(item.name, typedLocale)}
                      </NextLink>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* aria-live: results now change without a page reload as the visitor
          types (LiveSearchInput), so screen readers need an explicit nudge
          to notice — a plain re-render wouldn't otherwise announce anything. */}
      <section aria-live="polite" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{isFiltered ? t("articleIndex.noResults") : t("articleIndex.empty")}</p>
        ) : (
          <ScrollRevealGroup className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                locale={typedLocale}
                readingTimeLabel={(minutes) => t("article.readingTime", { minutes })}
              />
            ))}
          </ScrollRevealGroup>
        )}

        <div className="mt-14">
          <PaginationNav
            locale={typedLocale}
            basePath={basePath}
            page={page}
            pageCount={pageCount}
            searchParams={{ tag, q: query }}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
          />
        </div>
      </section>
    </>
  );
}
