import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { ArticleCard } from "@/components/site/article-card";
import { PaginationNav } from "@/components/site/pagination-nav";
import { listArticlesPublic } from "@/server/queries/articles";
import type { LocaleCode } from "@/lib/validation/locale";

function tagLabel(slug: string): string {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; tag: string }>;
}): Promise<Metadata> {
  const { locale, tag } = await params;
  const t = await getTranslations({ locale, namespace: "articleIndex" });
  return { title: `${tagLabel(tag)} — ${t("title")}`, alternates: { canonical: `/${locale}/articles/tag/${tag}` } };
}

type PageProps = {
  params: Promise<{ locale: string; tag: string }>;
  searchParams: Promise<{ page?: string }>;
};

// [tag] has no generateStaticParams, so it isn't statically enumerable —
// same Suspense requirement as the article index's searchParams.
export default function ArticlesByTagPage(props: PageProps) {
  return (
    <Suspense>
      <ArticlesByTagContent {...props} />
    </Suspense>
  );
}

async function ArticlesByTagContent({ params, searchParams }: PageProps) {
  const { locale, tag } = await params;
  const typedLocale = locale as LocaleCode;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const isRtl = typedLocale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const [t, { items, pageCount }] = await Promise.all([
    getTranslations(),
    listArticlesPublic({ locale: typedLocale, tag, page }),
  ]);

  const basePath = `/${typedLocale}/articles/tag/${tag}`;

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-16 sm:px-6 sm:py-20">
          <NextLink
            href={`/${typedLocale}/articles`}
            className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon aria-hidden="true" className="size-3.5" />
            {t("articleIndex.title")}
          </NextLink>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("articleIndex.tagsLabel")}</p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground capitalize sm:text-5xl">{tagLabel(tag)}</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t("articleIndex.noResults")}</p>
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
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
          />
        </div>
      </section>
    </>
  );
}
