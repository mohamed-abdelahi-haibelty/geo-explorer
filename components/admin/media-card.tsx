"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, FileText, Pencil, Video as VideoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMediaAsset } from "@/server/actions/media";
import { MediaDeleteDialog } from "@/components/admin/media-delete-dialog";
import { CldImage } from "@/components/media/cld-image";
import { formatBytes } from "@/lib/media-client";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/prisma/generated/client";

const TYPE_LABEL: Record<MediaAsset["type"], string> = { IMAGE: "Image", VIDEO: "Vidéo", RAW: "PDF" };

export function MediaCard({
  asset,
  posterUrl,
  selectable = false,
  selected = false,
  onToggleSelected,
}: {
  asset: MediaAsset;
  posterUrl: string | null;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelected?: () => void;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyAnnouncement, setCopyAnnouncement] = useState("");
  const [state, formAction, pending] = useActionState(updateMediaAsset, null);
  const displayName = asset.originalFilename ?? asset.publicId;

  const [handledState, setHandledState] = useState(state);
  if (handledState !== state) {
    setHandledState(state);
    if (state?.ok) setEditing(false);
  }

  useEffect(() => {
    if (state?.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleCopy() {
    await navigator.clipboard.writeText(asset.url);
    setCopied(true);
    setCopyAnnouncement("URL copiée dans le presse-papiers.");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-square bg-muted">
        {selectable && (
          <button
            type="button"
            onClick={onToggleSelected}
            aria-pressed={selected}
            aria-label={selected ? `Désélectionner ${displayName}` : `Sélectionner ${displayName}`}
            className={cn(
              "absolute top-2 right-2 z-10 flex size-5 items-center justify-center rounded-full border-2 transition-colors",
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/90 bg-black/25 backdrop-blur-xs hover:border-white",
            )}
          >
            {selected && <Check aria-hidden="true" className="size-3" />}
          </button>
        )}
        {asset.type === "IMAGE" ? (
          <CldImage
            publicId={asset.publicId}
            alt={asset.alt ?? ""}
            fill
            sizes="(min-width: 1024px) 220px, 45vw"
            blurDataUrl={asset.blurDataUrl}
          />
        ) : asset.type === "VIDEO" && posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- already-transformed Cloudinary derivative, not an optimizable next/image src
          <img src={posterUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            {asset.type === "VIDEO" ? (
              <VideoIcon aria-hidden="true" className="size-8" />
            ) : (
              <FileText aria-hidden="true" className="size-8" />
            )}
          </div>
        )}
        <Badge variant="secondary" className="absolute top-2 left-2 font-mono text-[10px] tracking-wide uppercase">
          {TYPE_LABEL[asset.type]}
        </Badge>
      </div>

      <div className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={displayName}>
            {displayName}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">{formatBytes(asset.bytes)}</p>
        </div>

        {editing ? (
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="id" value={asset.id} />
            <div className="flex flex-col gap-1">
              <Label htmlFor={`alt-${asset.id}`} className="text-xs">
                Texte alternatif {asset.type === "IMAGE" && <span className="text-destructive">*</span>}
              </Label>
              <Input id={`alt-${asset.id}`} name="alt" defaultValue={asset.alt ?? ""} />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor={`caption-${asset.id}`} className="text-xs">
                Légende
              </Label>
              <Input id={`caption-${asset.id}`} name="caption" defaultValue={asset.caption ?? ""} />
            </div>
            {state && !state.ok && (
              <p role="alert" className="text-xs text-destructive">
                {state.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Enregistrement…" : "Enregistrer"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p className="truncate text-xs text-muted-foreground">{asset.alt || "Sans texte alternatif"}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCopy}
                aria-label="Copier l'URL du média"
                title="Copier l'URL"
              >
                {copied ? (
                  <Check aria-hidden="true" className="size-3.5 text-primary" />
                ) : (
                  <Copy aria-hidden="true" className="size-3.5" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditing(true)}
                aria-label="Modifier le texte alternatif et la légende"
                title="Modifier"
              >
                <Pencil aria-hidden="true" className="size-3.5" />
              </Button>
              <MediaDeleteDialog id={asset.id} filename={displayName} />
              <span role="status" aria-live="polite" className="sr-only">
                {copyAnnouncement}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
