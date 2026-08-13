import { v2 as cloudinary } from "cloudinary";
import { env } from "@/server/env";
import type { CloudinaryResourceType } from "@/lib/validation/media";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Images are capped at upload time so nothing beyond delivery size ever lands
// in storage; video/raw pass through untouched and are size/duration-checked
// client-side and again in saveMediaAsset.
export function signUploadParams({ folder, resourceType }: { folder: string; resourceType: CloudinaryResourceType }) {
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign: Record<string, string | number> = { timestamp, folder };
  if (resourceType === "image") paramsToSign.transformation = "w_2400,c_limit";

  const signature = cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);

  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY,
    folder,
    resourceType,
    ...(resourceType === "image" ? { transformation: String(paramsToSign.transformation) } : {}),
  };
}

// Always f_auto,q_auto,dpr_auto — never a raw asset URL in markup.
export function deliveryUrl(publicId: string, { width }: { width?: number } = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ fetch_format: "auto", quality: "auto", dpr: "auto", ...(width ? { width, crop: "limit" } : {}) }],
  });
}

function lqipUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [{ width: 16, quality: 10, effect: "blur:2000" }],
  });
}

export function videoPosterUrl(publicId: string) {
  return cloudinary.url(publicId, {
    secure: true,
    resource_type: "video",
    format: "jpg",
    transformation: [{ start_offset: "2", fetch_format: "auto", quality: "auto" }],
  });
}

// Fetches the tiny w_16,q_10,e_blur derivative and inlines it as a data URI —
// this is the only binary ever stored in a column.
export async function fetchBlurDataUrl(publicId: string): Promise<string | null> {
  try {
    const response = await fetch(lqipUrl(publicId));
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

// Degradation policy: delete the row regardless of this call's outcome; a
// failure here just orphans the remote asset, logged for cleanup.
export async function destroyAsset(publicId: string, resourceType: CloudinaryResourceType) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  } catch (error) {
    console.error(
      JSON.stringify({ level: "error", event: "cloudinary_destroy_failed", publicId, resourceType }),
      error,
    );
  }
}
