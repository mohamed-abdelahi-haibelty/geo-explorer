import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listArticlesPublic } from "@/server/queries/articles";
import type { LocaleCode } from "@/lib/validation/locale";

function tagLabel(slug: string): string {
  return slug.replace(/-/g, " ");
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
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [t, { items, pageCount }] = await Promise.all([
    getTranslations("articleIndex"),
    listArticlesPublic({ locale: locale as LocaleCode, tag, page }),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{t("title")}</p>
        <h1 className="font-heading text-3xl text-foreground capitalize">{tagLabel(tag)}</h1>
      </div>

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
            <Link href={{ pathname: `/articles/tag/${tag}`, query: { page: page - 1 } }}>←</Link>
          ) : (
            <span />
          )}
          <span>
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={{ pathname: `/articles/tag/${tag}`, query: { page: page + 1 } }}>→</Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
