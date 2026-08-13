"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, DURATION } from "@/lib/motion";

// The home hero's one authored moment: bands composite in
// top-down, then the heading/subtitle/CTA rise into the cleared space, then
// a contour line draws itself in — one orchestrated timeline, not identical
// per-element fades. Server-rendered content is already complete and
// visible; this only choreographs how it arrives on a capable, motion-
// permitting client. Mark elements with data-hero-band / -heading /
// -subtitle / -cta / -line / -legend; any can be omitted.
export function HeroIntro({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const bands = el.querySelectorAll("[data-hero-band]");
      const heading = el.querySelector("[data-hero-heading]");
      const subtitle = el.querySelector("[data-hero-subtitle]");
      const cta = el.querySelector("[data-hero-cta]");
      const line = el.querySelector("[data-hero-line] path");
      const legend = el.querySelector("[data-hero-legend]");

      const tl = gsap.timeline({ defaults: { ease: EASE.signal } });

      if (bands.length) {
        gsap.set(bands, { scaleY: 0, transformOrigin: "top center" });
        tl.to(bands, { scaleY: 1, duration: DURATION.slow, stagger: 0.06 }, 0);
      }
      if (heading) tl.fromTo(heading, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: DURATION.base }, 0.45);
      if (subtitle) tl.fromTo(subtitle, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: DURATION.base }, 0.6);
      if (cta) tl.fromTo(cta, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: DURATION.fast }, 0.75);
      if (line instanceof SVGPathElement) {
        const length = line.getTotalLength();
        gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
        tl.to(line, { strokeDashoffset: 0, duration: DURATION.slow }, 0.5);
      }
      if (legend) tl.fromTo(legend, { opacity: 0 }, { opacity: 1, duration: DURATION.fast }, 0.9);
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
