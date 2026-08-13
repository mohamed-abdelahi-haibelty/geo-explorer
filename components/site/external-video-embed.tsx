"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { parseExternalVideoUrl } from "@/lib/external-video";

// Click-to-load — the iframe never mounts until the
// visitor presses play, so no YouTube/Vimeo bytes or third-party cookies
// load with the page. The thumbnail is a plain <img>, not next/image: the
// custom Cloudinary loader (next.config.ts) treats every `src` as a
// Cloudinary public_id, which would mis-resolve an external ytimg.com URL.
export function ExternalVideoEmbed({ url, title, playLabel }: { url: string; title: string; playLabel: string }) {
  const [loaded, setLoaded] = useState(false);
  const video = parseExternalVideoUrl(url);
  if (!video) return null;

  if (loaded) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          src={`${video.embedUrl}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-xl bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {video.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={video.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        <SpectralBandRow variant="hero" className="absolute inset-0 flex size-full" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
          <Play aria-hidden="true" className="size-6" fill="currentColor" />
        </span>
      </span>
      <span className="sr-only">{playLabel}</span>
    </button>
  );
}
