"use client";

import { useState } from "react";
import { ImageOff, UploadCloud } from "lucide-react";
import { MediaCard } from "@/components/admin/media-card";
import { MediaBulkBar } from "@/components/admin/media-bulk-bar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { MediaAsset } from "@/prisma/generated/client";

export function MediaGrid({
  items,
  page,
  pageCount,
  type,
  search,
  hasFilters,
}: {
  items: { asset: MediaAsset; posterUrl: string | null }[];
  page: number;
  pageCount: number;
  type?: string;
  search?: string;
  hasFilters: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    if (type) next.set("type", type);
    if (search) next.set("q", search);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/admin/medias?${qs}` : "/admin/medias";
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-16 text-center">
        {hasFilters ? (
          <>
            <ImageOff aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Aucun média ne correspond à ces critères. Essayez un autre mot-clé ou un autre type.
            </p>
          </>
        ) : (
          <>
            <UploadCloud aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              La bibliothèque est vide. Glissez vos premières images, vidéos ou PDF dans la zone ci-dessus pour les
              rendre disponibles pour vos articles, actualités, services et partenaires.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <MediaBulkBar selectedIds={[...selected]} onCleared={clearSelection} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map(({ asset, posterUrl }) => (
          <MediaCard
            key={asset.id}
            asset={asset}
            posterUrl={posterUrl}
            selectable
            selected={selected.has(asset.id)}
            onToggleSelected={() => toggleSelected(asset.id)}
          />
        ))}
      </div>

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Précédent"
                href={buildHref(Math.max(1, page - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 font-mono text-xs text-muted-foreground">
                Page {page} / {pageCount}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                text="Suivant"
                href={buildHref(Math.min(pageCount, page + 1))}
                className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
