// Pure URL string-building, no Cloudinary SDK — safe to import from both the
// client image loader and the (client + server) editor/content pipeline.
// `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is inlined at build time either way.
export function cloudinaryImageUrl(publicId: string, { width, quality }: { width: number; quality?: number }) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const params = ["f_auto", "dpr_auto", "c_limit", `w_${width}`, `q_${quality ?? "auto"}`];
  return `https://res.cloudinary.com/${cloudName}/image/upload/${params.join(",")}/${publicId}`;
}
