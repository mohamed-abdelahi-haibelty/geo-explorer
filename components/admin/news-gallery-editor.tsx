"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, GripVertical, ImagePlus, Video as VideoIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { pickLocalizedText } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";
import type { MediaType } from "@/prisma/generated/client";

export type NewsGalleryItem = {
  mediaId: string;
  type: MediaType;
  publicId: string;
  blurDataUrl: string | null;
  alt: string;
  caption: Partial<Record<LocaleCode, string>>;
};

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

// Ordered gallery — position is array index at save time (same rule
// ArticleAuthorsPicker's ordered multi-select follows). Reordering combines a
// native HTML5 drag handle (step 4's "drag-to-reorder") with up/down buttons,
// since drag alone isn't keyboard-operable (code-standards.md). Captions are
// locale-keyed (Task 05 step 0), so this component reads/writes only the
// currently active locale tab's value while the list itself — which media,
// what order — stays shared across every locale.
export function NewsGalleryEditor({
  value,
  activeLocale,
  onChange,
}: {
  value: NewsGalleryItem[];
  activeLocale: LocaleCode;
  onChange: (items: NewsGalleryItem[]) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(mediaId: string) {
    onChange(value.filter((item) => item.mediaId !== mediaId));
  }

  function setCaption(mediaId: string, text: string) {
    onChange(
      value.map((item) => (item.mediaId === mediaId ? { ...item, caption: { ...item.caption, [activeLocale]: text } } : item)),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-col gap-2">
          {value.map((item, index) => (
            <li
              key={item.mediaId}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`flex gap-3 rounded-lg border bg-card p-2 transition-colors ${
                overIndex === index && dragIndex !== null && dragIndex !== index ? "border-secondary" : "border-border"
              }`}
            >
              <span className="flex shrink-0 cursor-grab items-center text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                <GripVertical className="size-4" />
              </span>

              <div className="relative aspect-square size-16 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.type === "IMAGE" ? (
                  <CldImage publicId={item.publicId} alt={item.alt} fill sizes="64px" blurDataUrl={item.blurDataUrl} />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <VideoIcon aria-hidden="true" className="size-5" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Label htmlFor={`gallery-caption-${item.mediaId}`} className="text-xs text-muted-foreground">
                  Légende ({LOCALE_LABELS[activeLocale]})
                </Label>
                <Input
                  id={`gallery-caption-${item.mediaId}`}
                  value={item.caption[activeLocale] ?? ""}
                  onChange={(event) => setCaption(item.mediaId, event.target.value)}
                  placeholder="Légende facultative"
                  dir={activeLocale === "ar" ? "rtl" : "ltr"}
                  className="h-8"
                />
              </div>

              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">
                  <ChevronUp aria-hidden="true" className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Descendre"
                >
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(item.mediaId)} aria-label="Retirer du diaporama">
                  <X aria-hidden="true" className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MediaPicker
        multiple
        accept={["IMAGE", "VIDEO"]}
        trigger={
          <Button type="button" variant="outline" size="sm" className="w-fit">
            <ImagePlus aria-hidden="true" />
            Ajouter au diaporama
          </Button>
        }
        onSelect={(assets) => {
          const existingIds = new Set(value.map((item) => item.mediaId));
          const additions: NewsGalleryItem[] = assets
            .filter((asset) => !existingIds.has(asset.id))
            .map((asset) => ({
              mediaId: asset.id,
              type: asset.type,
              publicId: asset.publicId,
              blurDataUrl: asset.blurDataUrl,
              alt: asset.type === "IMAGE" ? pickLocalizedText(asset.alt, "fr") : "",
              caption: {},
            }));
          if (additions.length > 0) onChange([...value, ...additions]);
        }}
      />

      {value.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText aria-hidden="true" className="size-3.5" />
          Aucune image ni vidéo dans le diaporama.
        </p>
      )}
    </div>
  );
}
