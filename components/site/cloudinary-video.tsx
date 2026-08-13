import { cloudinaryVideoUrl, cloudinaryVideoPosterUrl } from "@/lib/cloudinary-url";

// Native <video preload="none"> already satisfies the "no video bytes
// fetched before the visitor initiates playback" requirement — browsers
// honor preload="none" strictly, no prefetch, only the controls/poster
// render until the visitor presses play. No client JS needed for this half;
// see components/site/external-video-embed.tsx for the click-to-load
// half (externalVideoUrl), which does need it.
export function CloudinaryVideo({
  publicId,
  format,
  alt,
}: {
  publicId: string;
  format: string;
  alt: string;
}) {
  return (
    <video
      controls
      preload="none"
      poster={cloudinaryVideoPosterUrl(publicId, { width: 1200 })}
      aria-label={alt}
      // `block` is load-bearing, not decorative: with preload="none" the
      // element has no intrinsic size (0×0) until playback starts, and a
      // <video> with no explicit `display` renders inline — an inline
      // replaced element with no intrinsic size ignores `w-full`/
      // `aspect-video` and collapses to its native/poster pixel width,
      // blowing out the layout on narrow viewports. Forcing block sizes it
      // from the container instead, exactly like Tailwind's own preflight
      // intends for img/video (verified: without this class the element
      // measured 1200px wide inside a 390px mobile viewport).
      className="block aspect-video w-full rounded-xl bg-muted object-cover"
    >
      <source src={cloudinaryVideoUrl(publicId, format)} type={`video/${format}`} />
    </video>
  );
}
