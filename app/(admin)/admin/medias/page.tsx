import type { Metadata } from "next";
import { MediaFilters } from "@/components/admin/media-filters";
import { MediaGrid } from "@/components/admin/media-grid";
import { MediaUploadQueue } from "@/components/admin/media-upload-queue";
import { listMedia } from "@/server/queries/media";
import { videoPosterUrl } from "@/server/services/cloudinary";
import type { MediaType } from "@/prisma/generated/client";

export const metadata: Metadata = { title: "Médias — Back-office GeoExplorer Services" };

const VALID_TYPES = ["IMAGE", "VIDEO", "RAW"] as const;

function parseType(value?: string): MediaType | undefined {
  return VALID_TYPES.includes(value as (typeof VALID_TYPES)[number]) ? (value as MediaType) : undefined;
}

export default async function MediasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const type = parseType(params.type);
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pageCount } = await listMedia({ type, search, page });
  const gridItems = items.map((asset) => ({
    asset,
    posterUrl: asset.type === "VIDEO" ? videoPosterUrl(asset.publicId) : null,
  }));
  const hasFilters = Boolean(type || search);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-foreground">Médias</h1>
        <p className="text-sm text-muted-foreground">
          {total} élément{total > 1 ? "s" : ""} dans la bibliothèque — images, vidéos et PDF utilisés sur le site.
        </p>
      </div>

      <MediaUploadQueue />

      <MediaFilters type={params.type} search={params.q} />

      <MediaGrid
        items={gridItems}
        page={page}
        pageCount={pageCount}
        type={params.type}
        search={params.q}
        hasFilters={hasFilters}
      />
    </div>
  );
}
