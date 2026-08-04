"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { EASE, DURATION } from "@/lib/motion";

/**
 * One authored load moment for the login screen: the header signal lights,
 * the band trio composes in, then the panel content rises — the world's
 * "layer compositing" motion vocabulary (DESIGN.md) applied to a single
 * above-the-fold surface instead of a scroll reveal. Initial hidden state
 * is set only from inside the GSAP callback, so a no-JS or reduced-motion
 * client always sees the fully visible end state, never a stuck ghost.
 */
export function LoginReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.set(".login-reveal-signal", { scale: 0, opacity: 0 });
      gsap.set(".login-reveal-band", { scaleX: 0 });
      gsap.set(".login-reveal-item", { y: 10, opacity: 0 });

      gsap
        .timeline({ defaults: { ease: EASE.signal } })
        .to(".login-reveal-signal", { scale: 1, opacity: 1, duration: DURATION.fast })
        .to(
          ".login-reveal-band",
          { scaleX: 1, duration: DURATION.base, stagger: 0.1 },
          "-=0.1",
        )
        .to(
          ".login-reveal-item",
          { y: 0, opacity: 1, duration: DURATION.base, stagger: 0.08 },
          "-=0.35",
        );
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
