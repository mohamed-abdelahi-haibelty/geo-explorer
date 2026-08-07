import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listArticlesPublic } from "@/server/queries/articles";
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
  searchParams: Promise<{ q?: string }>;
};

// `searchParams` isn't statically enumerable — same Suspense requirement as
// the article index/tag pages.
export default function SearchPage(props: PageProps) {
  return (
    <Suspense>
      <SearchContent {...props} />
    </Suspense>
  );
}

async function SearchContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = q?.trim();

  const [t, results] = await Promise.all([
    getTranslations("search"),
    query ? listArticlesPublic({ locale: locale as LocaleCode, search: query, page: 1 }) : Promise.resolve(null),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <form className="flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {t("placeholder")}
        </button>
      </form>

      {query && (
        <div className="flex flex-col gap-6">
          <h1 className="font-heading text-xl text-foreground">{t("resultsFor", { query })}</h1>
          {results?.items.length === 0 && <p className="text-muted-foreground">{t("empty")}</p>}
          <ul className="flex flex-col gap-6">
            {results?.items.map((item) => (
              <li key={item.slug} className="flex flex-col gap-1 border-b border-border pb-6 last:border-none">
                <Link href={`/articles/${item.slug}`} className="font-heading text-xl text-foreground hover:underline">
                  {item.title}
                </Link>
                {item.excerpt && <p className="text-sm text-muted-foreground">{item.excerpt}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
