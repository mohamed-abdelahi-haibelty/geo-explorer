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
  const t = await getTranslations({ locale, namespace: "articleIndex" });
  return { title: t("title") };
}

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

// `searchParams` isn't statically enumerable — Cache Components requires it
// (and anything downstream of it) inside <Suspense>, same pattern as
// app/(internal)/apercu/voir/[id]/page.tsx. The outer page stays sync and
// forwards the promises unawaited.
export default function ArticlesIndexPage(props: PageProps) {
  return (
    <Suspense>
      <ArticlesIndexContent {...props} />
    </Suspense>
  );
}

async function ArticlesIndexContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [t, { items, pageCount }] = await Promise.all([
    getTranslations("articleIndex"),
    listArticlesPublic({ locale: locale as LocaleCode, page }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <h1 className="font-heading text-3xl text-foreground">{t("title")}</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {items.map((item) => (
            <li key={item.slug} className="flex flex-col gap-1 border-b border-border pb-6 last:border-none">
              <Link href={`/articles/${item.slug}`} className="font-heading text-xl text-foreground hover:underline">
                {item.title}
              </Link>
              {item.excerpt && <p className="text-sm text-muted-foreground">{item.excerpt}</p>}
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          {page > 1 ? (
            <Link href={{ pathname: "/articles", query: { page: page - 1 } }}>←</Link>
          ) : (
            <span />
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={{ pathname: "/articles", query: { page: page + 1 } }}>→</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
