import { Suspense } from "react";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { X } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ArticlePdfLink } from "@/components/site/article-pdf-link";
import { getArticleForPreview } from "@/server/queries/articles";
import { pickLocalizedText } from "@/lib/locale";
import { LOCALES, DEFAULT_LOCALE, type LocaleCode } from "@/lib/validation/locale";

function parseLocale(value: string | undefined): LocaleCode {
  return (LOCALES as readonly string[]).includes(value ?? "") ? (value as LocaleCode) : DEFAULT_LOCALE;
}

// draftMode() and searchParams are request-time reads — Cache Components
// requires them inside a Suspense boundary (same rule Task 02's AdminGate
// follows for headers()/cookies()).
async function PreviewContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { id } = await params;
  const { locale: rawLocale } = await searchParams;
  const locale = parseLocale(rawLocale);
  const { isEnabled } = await draftMode();
  if (!isEnabled) notFound();

  const article = await getArticleForPreview(id, locale);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-secondary px-4 py-2 text-secondary-foreground">
        <p className="font-mono text-xs tracking-wide uppercase">
          Aperçu du brouillon — non indexé, visible uniquement via ce lien
        </p>
        <Link
          href={`/apercu/quitter?redirect=/admin/articles/${article.id}`}
          prefetch={false}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium hover:bg-secondary-foreground/10"
        >
          <X aria-hidden="true" className="size-3.5" />
          Quitter l&apos;aperçu
        </Link>
      </div>

      <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
        {article.cover && (
          <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
            <CldImage
              publicId={article.cover.publicId}
              alt={pickLocalizedText(article.cover.alt, locale)}
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
            {article.authors.map((row) => row.author.name).join(", ") || "Sans auteur"} · {article.readingTime} min
            de lecture
          </p>
          {article.pdfUrl && <ArticlePdfLink url={article.pdfUrl} label="Étude complète (PDF)" />}
        </header>

        {/* contentHtml is sanitized server-side at save time (server/services/content.ts) */}
        <div className="article-content max-w-none" dangerouslySetInnerHTML={{ __html: article.contentHtml }} />

        {article.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {article.tags.map(({ tag }) => (
              <li key={tag.id} className="rounded-full bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                {pickLocalizedText(tag.name, locale)}
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

// Reached only via the signed link from app/apercu/[token]/route.ts, which
// sets the Draft Mode bypass cookie PreviewContent's check relies on — never
// served from the public cache (architecture-full.md §11 point 3).
export default function ArticlePreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  return (
    <Suspense>
      <PreviewContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
