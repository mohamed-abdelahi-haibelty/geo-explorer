"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, FileText, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { saveMediaAsset } from "@/server/actions/media";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import { detectResourceType, formatBytes, readVideoDuration, resolveFormat, validateFileSize } from "@/lib/media-client";
import { MEDIA_LIMITS } from "@/lib/validation/media";
import { cn } from "@/lib/utils";

type QueueItem = {
  id: string;
  file: File;
  resourceType: "image" | "video" | "raw";
  status: "uploading" | "needs-alt" | "saving" | "done" | "error";
  progress: number;
  error?: string;
  publicId?: string;
  alt: string;
  caption: string;
};

const ACCEPT = [...MEDIA_LIMITS.image.formats, ...MEDIA_LIMITS.video.formats, ...MEDIA_LIMITS.raw.formats]
  .map((ext) => `.${ext}`)
  .join(",");

function ItemIcon({ resourceType }: { resourceType: QueueItem["resourceType"] }) {
  if (resourceType === "video") return <Video aria-hidden="true" className="size-5" />;
  if (resourceType === "raw") return <FileText aria-hidden="true" className="size-5" />;
  return <Upload aria-hidden="true" className="size-5" />;
}

export function MediaUploadQueue({ onUploaded }: { onUploaded?: () => void }) {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function patchItem(id: string, patch: Partial<QueueItem>) {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function retryItem(id: string) {
    const item = items.find((entry) => entry.id === id);
    if (!item) return;
    removeItem(id);
    void processFile(item.file);
  }

  async function persist(item: QueueItem, uploaded: { publicId: string; format: string; url: string; width?: number; height?: number; duration?: number; bytes: number; originalFilename: string }) {
    patchItem(item.id, { status: "saving" });
    const result = await saveMediaAsset({
      publicId: uploaded.publicId,
      resourceType: item.resourceType,
      format: uploaded.format,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      duration: uploaded.duration,
      bytes: uploaded.bytes,
      folder: "geoexplorer",
      originalFilename: uploaded.originalFilename,
      alt: item.alt || undefined,
      caption: item.caption || undefined,
    });

    if (!result.ok) {
      patchItem(item.id, { status: "error", error: result.message });
      return;
    }

    pendingUploads.delete(item.id);
    patchItem(item.id, { status: "done" });
    onUploaded?.();
    setTimeout(() => removeItem(item.id), 1600);
  }

  async function processFile(file: File) {
    const id = crypto.randomUUID();
    const resourceType = detectResourceType(file);

    if (!resourceType) {
      setItems((current) => [
        ...current,
        { id, file, resourceType: "raw", status: "error", progress: 0, error: "Format non pris en charge.", alt: "", caption: "" },
      ]);
      return;
    }

    const sizeError = validateFileSize(file, resourceType);
    if (sizeError) {
      setItems((current) => [...current, { id, file, resourceType, status: "error", progress: 0, error: sizeError, alt: "", caption: "" }]);
      return;
    }

    if (resourceType === "video") {
      try {
        const duration = await readVideoDuration(file);
        if (duration > MEDIA_LIMITS.video.maxDurationSeconds) {
          setItems((current) => [
            ...current,
            {
              id,
              file,
              resourceType,
              status: "error",
              progress: 0,
              error: `Vidéo trop longue (${MEDIA_LIMITS.video.maxDurationSeconds} s maximum) — raccourcissez-la ou compressez-la avant de l'envoyer.`,
              alt: "",
              caption: "",
            },
          ]);
          return;
        }
      } catch {
        setItems((current) => [
          ...current,
          { id, file, resourceType, status: "error", progress: 0, error: "Vidéo illisible.", alt: "", caption: "" },
        ]);
        return;
      }
    }

    setItems((current) => [...current, { id, file, resourceType, status: "uploading", progress: 0, alt: "", caption: "" }]);

    try {
      const uploaded = await uploadToCloudinary(file, resourceType, (progress) => patchItem(id, { progress }));
      const normalized = {
        publicId: uploaded.public_id,
        format: resolveFormat(uploaded.format, file),
        url: uploaded.secure_url,
        width: uploaded.width,
        height: uploaded.height,
        duration: uploaded.duration,
        bytes: uploaded.bytes,
        originalFilename: uploaded.original_filename,
      };

      if (resourceType === "image") {
        pendingUploads.set(id, normalized);
        patchItem(id, { status: "needs-alt", publicId: normalized.publicId, progress: 100 });
        return;
      }

      await persist({ id, file, resourceType, status: "uploading", progress: 100, alt: "", caption: "" }, normalized);
    } catch (error) {
      patchItem(id, { status: "error", error: error instanceof Error ? error.message : "Échec de l'envoi." });
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    Array.from(fileList).forEach((file) => void processFile(file));
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-8 text-center outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
          dragActive ? "border-primary bg-accent/40" : "border-border hover:border-secondary/40 hover:bg-muted/50",
        )}
      >
        <Upload aria-hidden="true" className="size-5 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Glissez des fichiers ici, ou{" "}
          <span className="text-secondary underline underline-offset-2">choisissez-les</span>
        </p>
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Images 10 Mo · Vidéo 100 Mo / 120 s · PDF 20 Mo
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
          className="sr-only"
        />
      </div>

      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {item.status === "done" ? (
                    <Check aria-hidden="true" className="size-5 text-primary" />
                  ) : item.status === "error" ? (
                    <AlertTriangle aria-hidden="true" className="size-5 text-destructive" />
                  ) : (
                    <ItemIcon resourceType={item.resourceType} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{item.file.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {formatBytes(item.file.size)}
                    {item.status === "uploading" && ` · ${item.progress}%`}
                    {item.status === "saving" && " · enregistrement…"}
                    {item.status === "done" && " · ajouté"}
                  </p>
                </div>
                {item.status === "error" && (
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => retryItem(item.id)}>
                      Réessayer
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      Retirer
                    </Button>
                  </div>
                )}
              </div>

              {(item.status === "uploading" || item.status === "saving") && (
                <Progress value={item.status === "saving" ? 100 : item.progress} className="h-1.5" />
              )}

              {item.status === "error" && (
                <p role="alert" className="text-xs text-destructive">
                  {item.error}
                </p>
              )}

              {item.status === "needs-alt" && (
                <div className="flex flex-col gap-2 border-t border-border pt-2.5">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`alt-${item.id}`} className="text-xs">
                      Texte alternatif <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`alt-${item.id}`}
                      value={item.alt}
                      onChange={(event) => patchItem(item.id, { alt: event.target.value })}
                      placeholder="Décrivez l'image pour l'accessibilité"
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`caption-${item.id}`} className="text-xs">
                      Légende (facultatif)
                    </Label>
                    <Input
                      id={`caption-${item.id}`}
                      value={item.caption}
                      onChange={(event) => patchItem(item.id, { caption: event.target.value })}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!item.alt.trim()}
                    onClick={() => {
                      const uploaded = pendingUploads.get(item.id);
                      if (uploaded) void persist(item, uploaded);
                    }}
                    className="self-start"
                  >
                    Ajouter à la bibliothèque
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Upload results for images awaiting alt text live outside React state — they
// hold File/Blob-derived data that doesn't need to trigger re-renders itself.
const pendingUploads = new Map<
  string,
  { publicId: string; format: string; url: string; width?: number; height?: number; duration?: number; bytes: number; originalFilename: string }
>();
