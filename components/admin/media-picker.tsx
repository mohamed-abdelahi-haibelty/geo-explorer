"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, FileText, ImageOff, Search, Video as VideoIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaUploadQueue } from "@/components/admin/media-upload-queue";
import { CldImage } from "@/components/media/cld-image";
import { searchMediaAction } from "@/server/actions/media";
import { cn } from "@/lib/utils";
import { pickLocalizedText } from "@/lib/locale";
import type { MediaAsset, MediaType } from "@/prisma/generated/client";

const TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Vidéos" },
  { value: "RAW", label: "PDF" },
];

// The only sanctioned media entry point used to attach a cover,
// hero, logo, photo or gallery item.
export function MediaPicker({
  trigger,
  multiple = false,
  accept,
  onSelect,
}: {
  trigger: React.ReactElement;
  multiple?: boolean;
  accept?: MediaType[];
  onSelect: (assets: MediaAsset[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"browse" | "upload">("browse");
  const [type, setType] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: MediaAsset[]; pageCount: number } | null>(null);
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const [pending, startTransition] = useTransition();

  function fetchPage() {
    startTransition(async () => {
      const res = await searchMediaAction({
        type: type === "all" ? undefined : type,
        search: search || undefined,
        page,
      });
      if (res.ok) setResult({ items: res.data.items, pageCount: res.data.pageCount });
    });
  }

  useEffect(() => {
    if (!open) return;
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, type, page]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(() => {
      setPage(1);
      fetchPage();
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const items = accept ? (result?.items ?? []).filter((item) => accept.includes(item.type)) : (result?.items ?? []);

  function toggleSelect(asset: MediaAsset) {
    setSelected((current) => {
      const exists = current.some((item) => item.id === asset.id);
      if (multiple) return exists ? current.filter((item) => item.id !== asset.id) : [...current, asset];
      return exists ? [] : [asset];
    });
  }

  function handleConfirm() {
    onSelect(selected);
    setOpen(false);
    setSelected([]);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSelected([]);
          setTab("browse");
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bibliothèque de médias</DialogTitle>
          <DialogDescription>
            {multiple ? "Sélectionnez un ou plusieurs médias." : "Sélectionnez un média."}
          </DialogDescription>
        </DialogHeader>

        <div role="tablist" className="flex gap-4 border-b border-border">
          {(["browse", "upload"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              id={`media-picker-tab-${value}`}
              aria-selected={tab === value}
              aria-controls={`media-picker-panel-${value}`}
              onClick={() => setTab(value)}
              className={cn(
                "border-b-2 px-0.5 pb-2 text-sm font-medium transition-colors",
                tab === value ? "border-secondary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "browse" ? "Parcourir" : "Envoyer"}
            </button>
          ))}
        </div>

        {tab === "upload" ? (
          <div role="tabpanel" id="media-picker-panel-upload" aria-labelledby="media-picker-tab-upload">
            <MediaUploadQueue
              onUploaded={() => {
                setTab("browse");
                setPage(1);
                fetchPage();
              }}
            />
          </div>
        ) : (
          <div role="tabpanel" id="media-picker-panel-browse" aria-labelledby="media-picker-tab-browse" className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher"
                  className="pl-8"
                  aria-label="Rechercher un média"
                />
              </div>
              <Select
                items={TYPE_OPTIONS}
                value={type}
                onValueChange={(value) => {
                  setType(String(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-40" aria-label="Filtrer par type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid max-h-96 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
              {pending && !result ? (
                <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Chargement…</p>
              ) : items.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                  <ImageOff aria-hidden="true" className="size-5" />
                  Aucun média.
                </div>
              ) : (
                items.map((asset) => {
                  const isSelected = selected.some((item) => item.id === asset.id);
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => toggleSelect(asset)}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                        isSelected ? "border-primary" : "border-transparent hover:border-border",
                      )}
                    >
                      {asset.type === "IMAGE" ? (
                        <CldImage
                          publicId={asset.publicId}
                          alt={pickLocalizedText(asset.alt, "fr")}
                          fill
                          sizes="160px"
                          blurDataUrl={asset.blurDataUrl}
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                          {asset.type === "VIDEO" ? (
                            <VideoIcon aria-hidden="true" className="size-6" />
                          ) : (
                            <FileText aria-hidden="true" className="size-6" />
                          )}
                        </div>
                      )}
                      {isSelected && (
                        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check aria-hidden="true" className="size-3" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {result && result.pageCount > 1 && (
              <div className="flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Précédent
                </Button>
                <span className="font-mono text-xs text-muted-foreground">
                  Page {page} / {result.pageCount}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= result.pageCount}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </Button>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="button" disabled={selected.length === 0} onClick={handleConfirm}>
            Sélectionner{selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
