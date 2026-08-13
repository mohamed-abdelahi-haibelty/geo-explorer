// Pure URL string-building, no Cloudinary SDK — safe to import from both the
// client image loader and the (client + server) editor/content pipeline.
// `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is inlined at build time either way.
export function cloudinaryImageUrl(publicId: string, { width, quality }: { width: number; quality?: number }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const params = ["f_auto", "dpr_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`];
  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(",")}/${publicId}`;
}

// Video delivery needs a real container extension in the URL (the <video>
// element's src, unlike next/image, isn't routed through a loader that can
// negotiate format) — `format` is the value MediaAsset stored at upload time.
export function cloudinaryVideoUrl(publicId: string, format: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto/${publicId}.${format}`;
}

// Cloudinary derives a poster frame from any video by requesting it with a
// .jpg extension on the video/upload path — no separate asset to manage.
export function cloudinaryVideoPosterUrl(publicId: string, { width }: { width: number }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/f_auto,q_auto,c_limit,w_${width}/${publicId}.jpg`;
}
