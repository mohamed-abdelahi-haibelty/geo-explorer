"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, DURATION, REVEAL_SCROLL_TRIGGER } from "@/lib/motion";

type RevealFrom = "band" | "rise" | "line";

// The public site's one shared scroll-entry primitive — implements
// DESIGN.md's "layer compositing" motion vocabulary (bands wiping in,
// contour lines drawing, elements rising into place) without scattering a
// dozen bespoke ScrollTrigger calls across every page. Content is genuinely
// visible in the server-rendered HTML; GSAP only pulls it from a slightly
// offset/clipped state on mount, so no-JS and prefers-reduced-motion both
// see the finished layout immediately, never a blank or stuck-hidden page.
export function ScrollReveal({
  children,
  className,
  from = "rise",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  from?: RevealFrom;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const isRtl = document.documentElement.dir === "rtl";
      const fromVars =
        from === "band"
          ? { clipPath: "inset(0 0 100% 0)" }
          : from === "line"
            ? { scaleX: 0, transformOrigin: isRtl ? "right center" : "left center" }
            : { y: 28, opacity: 0 };
      const toVars = from === "band" ? { clipPath: "inset(0 0 0% 0)" } : from === "line" ? { scaleX: 1 } : { y: 0, opacity: 1 };

      gsap.set(el, fromVars);
      gsap.to(el, {
        ...toVars,
        duration: DURATION.band,
        delay,
        ease: EASE.signal,
        scrollTrigger: { trigger: el, ...REVEAL_SCROLL_TRIGGER },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

// Staggered variant for lists (values, strengths, teasers) — each direct
// child rises into place in sequence rather than as one flat block.
export function ScrollRevealGroup({
  children,
  className,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const items = el.querySelectorAll(":scope > *");
      gsap.set(items, { y: 20, opacity: 0 });
      gsap.to(items, {
        y: 0,
        opacity: 1,
        duration: DURATION.base,
        ease: EASE.signal,
        stagger,
        scrollTrigger: { trigger: el, ...REVEAL_SCROLL_TRIGGER },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
