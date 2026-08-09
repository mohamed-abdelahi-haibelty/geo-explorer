import Link from "next/link";
import type { Metadata } from "next";
import { Image as ImageIcon, Images, Newspaper, Plus } from "lucide-react";
import { NewsFilters } from "@/components/admin/news-filters";
import { NewsRowActions } from "@/components/admin/news-row-actions";
import { EmptyState } from "@/components/admin/empty-state";
import { CldImage } from "@/components/media/cld-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listNewsAdmin } from "@/server/queries/news";
import { bestTranslation } from "@/lib/translation-display";
import type { Locale as PrismaLocale, PublishStatus } from "@/prisma/generated/client";

export const metadata: Metadata = { title: "Actualités — Back-office GeoExplorer Services" };

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

export default async function ActualitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = VALID_STATUSES.includes(params.status as (typeof VALID_STATUSES)[number])
    ? (params.status as PublishStatus)
    : undefined;
  const sort = VALID_SORTS.includes(params.sort as (typeof VALID_SORTS)[number])
    ? (params.sort as (typeof VALID_SORTS)[number])
    : "updated_desc";
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pageCount } = await listNewsAdmin({ search, status, sort, page });

  const hasFilters = Boolean(search || status);

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    if (search) next.set("q", search);
    if (status) next.set("status", status);
    if (sort !== "updated_desc") next.set("sort", sort);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/admin/actualites?${qs}` : "/admin/actualites";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Actualités</h1>
          <p className="text-sm text-muted-foreground">
            {total} actualité{total > 1 ? "s" : ""} — événements et communications de l&apos;équipe.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/actualites/nouveau" />}>
          <Plus aria-hidden="true" />
          Nouvelle actualité
        </Button>
      </div>

      <NewsFilters search={params.q} status={params.status} sort={sort} />

      {items.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={hasFilters ? "Aucun résultat" : "Aucune actualité"}
          description={hasFilters ? "Aucune actualité ne correspond à ces critères." : "Créez la première actualité."}
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
                <TableHead>Diaporama</TableHead>
                <TableHead>FR / EN / AR</TableHead>
                <TableHead>Mis à jour</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const title = bestTranslation(item.translations)?.title ?? "Actualité sans titre";
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {item.cover ? (
                          <CldImage publicId={item.cover.publicId} alt="" fill sizes="40px" blurDataUrl={item.cover.blurDataUrl} />
                        ) : (
                          <ImageIcon aria-hidden="true" className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <Link
                        href={`/admin/actualites/${item.id}`}
                        title={title}
                        className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
                      >
                        <span className="truncate">{title}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Images aria-hidden="true" className="size-3.5" />
                        {item.media.length}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {LOCALE_ORDER.map((locale) => {
                          const translation = item.translations.find((t) => t.locale === locale);
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
                      {item.updatedAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <NewsRowActions
                        newsId={item.id}
                        title={title}
                        translations={item.translations.map((t) => ({
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
