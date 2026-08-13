"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";

// The iframe never lands in the server-rendered HTML — only a decorative
// static preview does. Clicking swaps in the real embed on the client, so
// the initial page load never pays for (or waits on) Google Maps' script
// and never sends the visitor's IP to a third party before they've asked
// for the map.
export function ContactMap({ embedUrl, cta, label }: { embedUrl: string | null; cta: string; label: string }) {
  const [loaded, setLoaded] = useState(false);

  if (!embedUrl) return null;

  if (loaded) {
    return (
      <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border sm:aspect-16/9">
        <iframe
          src={embedUrl}
          title={label}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-2xl border border-border transition-colors hover:border-primary/40 sm:aspect-16/9"
    >
      <SpectralBandRow variant="quiet" className="absolute inset-0 flex h-full w-full" />
      <ContourLine className="absolute inset-x-8 bottom-8 h-10 text-secondary/40" />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-foreground shadow-md transition-transform group-hover:scale-105">
        <MapPin aria-hidden="true" className="size-4 text-primary" />
        {cta}
      </span>
    </button>
  );
}
