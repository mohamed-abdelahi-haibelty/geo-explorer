import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Image as ImageIcon, Plus, Star } from "lucide-react";
import { ArticleFilters } from "@/components/admin/article-filters";
import { ArticleRowActions } from "@/components/admin/article-row-actions";
import { EmptyState } from "@/components/admin/empty-state";
import { CldImage } from "@/components/media/cld-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listArticlesAdmin } from "@/server/queries/articles";
import { listAuthors } from "@/server/queries/authors";
import { bestTranslation } from "@/lib/article-display";
import type { Locale as PrismaLocale, PublishStatus } from "@/prisma/generated/client";

export const metadata: Metadata = { title: "Articles — Back-office GeoExplorer Services" };

const STATUS_LABEL: Record<PublishStatus, string> = { DRAFT: "Brouillon", PUBLISHED: "Publié", ARCHIVED: "Archivé" };
const STATUS_VARIANT: Record<PublishStatus, "secondary" | "default" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};
const LOCALE_ORDER: PrismaLocale[] = ["FR", "EN", "AR"];
const LOCALE_LABEL: Record<PrismaLocale, string> = { FR: "FR", EN: "EN", AR: "AR" };
const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const VALID_SORTS = ["updated_desc", "updated_asc"] as const;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; author?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as (typeof VALID_STATUSES)[number])
    ? (params.status as PublishStatus)
    : undefined;
  const sort = VALID_SORTS.includes(params.sort as (typeof VALID_SORTS)[number])
    ? (params.sort as (typeof VALID_SORTS)[number])
    : "updated_desc";
  const search = params.q?.trim() || undefined;
  const authorId = params.author || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ items, total, pageCount }, authors] = await Promise.all([
    listArticlesAdmin({ search, status, authorId, sort, page }),
    listAuthors(),
  ]);

  const hasFilters = Boolean(search || status || authorId);

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status) next.set("status", status);
    if (authorId) next.set("author", authorId);
    if (sort !== "updated_desc") next.set("sort", sort);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/admin/articles?${qs}` : "/admin/articles";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Articles</h1>
          <p className="text-sm text-muted-foreground">
            {total} article{total > 1 ? "s" : ""} — études techniques publiées par l&apos;équipe.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/articles/nouveau" />}>
          <Plus aria-hidden="true" />
          Nouvel article
        </Button>
      </div>

      <ArticleFilters search={params.q} status={params.status} authorId={params.author} sort={sort} authors={authors.map((a) => ({ id: a.id, name: a.name }))} />

      {items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={hasFilters ? "Aucun résultat" : "Aucun article"}
          description={hasFilters ? "Aucun article ne correspond à ces critères." : "Créez le premier article technique."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14">
                  <span className="sr-only">Couverture</span>
                </TableHead>
                <TableHead>Titre</TableHead>
                <TableHead>Auteurs</TableHead>
                <TableHead>FR / EN / AR</TableHead>
                <TableHead>Mis à jour</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((article) => {
                const title = bestTranslation(article.translations)?.title ?? "Article sans titre";
                return (
                  <TableRow key={article.id}>
                    <TableCell>
                      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {article.cover ? (
                          <CldImage publicId={article.cover.publicId} alt="" fill sizes="40px" blurDataUrl={article.cover.blurDataUrl} />
                        ) : (
                          <ImageIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`/admin/articles/${article.id}`}
                        title={title}
                        className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
                      >
                        {article.featured && <Star aria-hidden="true" className="size-3.5 shrink-0 fill-primary text-primary" />}
                        <span className="truncate">{title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-muted-foreground" title={article.authors.map((row) => row.author.name).join(", ") || undefined}>
                      {article.authors.map((row) => row.author.name).join(", ") || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {LOCALE_ORDER.map((locale) => {
                          const translation = article.translations.find((t) => t.locale === locale);
                          return (
                            <span key={locale} className="flex flex-col items-center gap-0.5">
                              <span className="font-mono text-[9px] text-muted-foreground">{LOCALE_LABEL[locale]}</span>
                              {translation ? (
                                <Badge variant={STATUS_VARIANT[translation.status]} className="px-1.5 text-[10px]">
                                  {STATUS_LABEL[translation.status]}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="px-1.5 text-[10px] text-muted-foreground">
                                  —
                                </Badge>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {article.updatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <ArticleRowActions
                        articleId={article.id}
                        title={title}
                        translations={article.translations.map((t) => ({
                          locale: t.locale,
                          status: t.status,
                          translationId: t.id,
                        }))}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious text="Précédent" href={buildHref(Math.max(1, page - 1))} className={page <= 1 ? "pointer-events-none opacity-50" : undefined} />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 font-mono text-xs text-muted-foreground">
                Page {page} / {pageCount}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext text="Suivant" href={buildHref(Math.min(pageCount, page + 1))} className={page >= pageCount ? "pointer-events-none opacity-50" : undefined} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
