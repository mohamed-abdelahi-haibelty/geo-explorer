import { ALLOWED_FOLDERS } from "@/lib/validation/media";
import type { DetectedResourceType } from "@/lib/media-client";

export type CloudinaryUploadResult = {
  public_id: string;
  format: string;
  secure_url: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
  original_filename: string;
};

type SignPayload = {
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
  transformation?: string;
};

async function requestSignature(resourceType: DetectedResourceType): Promise<SignPayload> {
  const response = await fetch("/api/cloudinary/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: ALLOWED_FOLDERS[0], resourceType }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? "Impossible d'obtenir une autorisation d'envoi.");
  }
  return response.json();
}

// Direct signed browser → Cloudinary upload: the file never transits the
// Next server. XHR (not fetch) for upload progress.
export function uploadToCloudinary(
  file: File,
  resourceType: DetectedResourceType,
  onProgress?: (percent: number) => void,
): Promise<CloudinaryUploadResult> {
  return requestSignature(resourceType).then((sign) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sign.apiKey);
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", sign.signature);
    form.append("folder", sign.folder);
    if (sign.transformation) form.append("transformation", sign.transformation);

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const body = JSON.parse(xhr.responseText || "{}") as { error?: { message?: string } };
          reject(new Error(body.error?.message ?? "L'envoi vers Cloudinary a échoué."));
        }
      };
      xhr.onerror = () => reject(new Error("L'envoi vers Cloudinary a échoué."));
      xhr.send(form);
    });
  });
}
