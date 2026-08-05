import { MEDIA_LIMITS } from "@/lib/validation/media";
import type { MediaUsageKind } from "@/server/queries/media";

export type DetectedResourceType = "image" | "video" | "raw";

export const MEDIA_USAGE_KIND_LABEL: Record<MediaUsageKind, string> = {
  article: "Article",
  news: "Actualité",
  author: "Photo d'auteur",
  service: "Service",
  partner: "Logo partenaire",
  gallery: "Galerie d'actualité",
};

function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "";
}

export function detectResourceType(file: File): DetectedResourceType | null {
  const ext = fileExtension(file);
  if ((MEDIA_LIMITS.image.formats as readonly string[]).includes(ext)) return "image";
  if ((MEDIA_LIMITS.video.formats as readonly string[]).includes(ext)) return "video";
  if ((MEDIA_LIMITS.raw.formats as readonly string[]).includes(ext)) return "raw";
  return null;
}

// Cloudinary omits `format` for raw-resource uploads (no format detection for
// non-image/video assets) — fall back to the file's own extension.
export function resolveFormat(uploadedFormat: string | undefined, file: File): string {
  return uploadedFormat || fileExtension(file);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function validateFileSize(file: File, resourceType: DetectedResourceType): string | null {
  const limit = MEDIA_LIMITS[resourceType].maxBytes;
  if (file.size > limit) return `Fichier trop volumineux (${formatBytes(limit)} maximum).`;
  return null;
}

// Read via a detached <video> element rather than trusting file metadata —
// the only way to know duration before it reaches Cloudinary.
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire les métadonnées de la vidéo."));
    };
    video.src = url;
  });
}
