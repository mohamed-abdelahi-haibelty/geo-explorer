import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { NewsCard } from "@/components/site/news-card";
import { PaginationNav } from "@/components/site/pagination-nav";
import { listNewsPublic } from "@/server/queries/news";
import type { LocaleCode } from "@/lib/validation/locale";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsIndex" });
  return { title: t("title"), alternates: { canonical: `/${locale}/actualites` } };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

// `searchParams` isn't statically enumerable — same Suspense requirement as
// the article index.
export default function NewsIndexPage(props: PageProps) {
  return (
    <Suspense>
      <NewsIndexContent {...props} />
    </Suspense>
  );
}

async function NewsIndexContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [t, { items, pageCount }] = await Promise.all([getTranslations(), listNewsPublic({ locale: typedLocale, page })]);
  const basePath = `/${typedLocale}/actualites`;

  return (
    <>
      {/* Cobalt band — the same color role home's "LATEST NEWS" teaser
          carries, reused here so news reads as one identity across the
          site rather than a second grammar. */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0 opacity-40" aria-hidden="true">
          <SpectralBandRow variant="quiet" className="flex h-full w-full" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="max-w-2xl text-balance font-heading text-4xl font-semibold tracking-tight sm:text-5xl">{t("newsIndex.title")}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("newsIndex.empty")}</p>
        ) : (
          <ScrollRevealGroup className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <NewsCard key={item.slug} item={item} locale={typedLocale} videoLabel={t("site.videoBadge")} />
            ))}
          </ScrollRevealGroup>
        )}

        <div className="mt-14">
          <PaginationNav
            locale={typedLocale}
            basePath={basePath}
            page={page}
            pageCount={pageCount}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
          />
        </div>
      </section>
    </>
  );
}
