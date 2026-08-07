"use client";

import { cloudinaryImageUrl } from "@/lib/cloudinary-url";

// next.config.ts wires this in as images.loaderFile. `src` is a Cloudinary
// publicId (never a full URL) — see components/media/cld-image.tsx.
export default function cloudinaryImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  return cloudinaryImageUrl(src, { width, quality });
}
