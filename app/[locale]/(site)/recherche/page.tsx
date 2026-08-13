import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { Search } from "lucide-react";
import { PaginationNav } from "@/components/site/pagination-nav";
import { searchPublic } from "@/server/queries/search";
import { formatDate } from "@/lib/format-date";
import type { LocaleCode } from "@/lib/validation/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "nav" });
  return { title: t("search") };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
};

// `searchParams` isn't statically enumerable — same Suspense requirement as
// every other query-param-driven page in (site)/**.
export default function SearchPage(props: PageProps) {
  return (
    <Suspense>
      <SearchContent {...props} />
    </Suspense>
  );
}

async function SearchContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const { q, page: pageParam } = await searchParams;
  const query = q?.trim();
  const page = Math.max(1, Number(pageParam) || 1);

  const [t, results] = await Promise.all([
    getTranslations(),
    query ? searchPublic({ locale: typedLocale, query, page }) : Promise.resolve(null),
  ]);

  const basePath = `/${typedLocale}/recherche`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20">
      <div className="flex flex-col gap-4">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("nav.search")}</h1>
        <form action={basePath} method="get" className="flex gap-2">
          <div className="relative flex-1">
            <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="h-11 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button type="submit" className="h-11 shrink-0 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85">
            {t("search.submit")}
          </button>
        </form>
      </div>

      {query && (
        <div className="flex flex-col gap-8">
          <h2 className="font-heading text-lg text-foreground">{t("search.resultsFor", { query })}</h2>

          {results?.items.length === 0 ? (
            <p className="text-muted-foreground">{t("search.empty")}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {results?.items.map((hit) => {
                const href =
                  hit.kind === "article" ? `/${typedLocale}/articles/${hit.item.slug}` : `/${typedLocale}/actualites/${hit.item.slug}`;
                const date =
                  hit.kind === "article"
                    ? hit.item.publishedAt
                    : (hit.item.news.eventDate ?? hit.item.publishedAt);
                const excerpt = hit.item.excerpt;

                return (
                  <li key={`${hit.kind}-${hit.item.id}`}>
                    <NextLink href={href} className="group flex flex-col gap-1.5 py-6">
                      <span className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] tracking-wide uppercase">
                          {hit.kind === "article" ? t("search.kindArticle") : t("search.kindNews")}
                        </span>
                        {date && formatDate(date, typedLocale)}
                      </span>
                      <span className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
                        {hit.item.title}
                      </span>
                      {excerpt && <span className="line-clamp-2 text-sm text-muted-foreground">{excerpt}</span>}
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          )}

          {results && (
            <PaginationNav
              locale={typedLocale}
              basePath={basePath}
              page={results.page}
              pageCount={results.pageCount}
              searchParams={{ q: query }}
              prevLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
            />
          )}
        </div>
      )}
    </div>
  );
}
