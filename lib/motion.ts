/**
 * Motion vocabulary for the spectral/remote-sensing direction (see the
 * contract in app/layout.tsx and DESIGN.md). Mirrors the --ease-signal /
 * --shadow-* tokens in app/globals.css so CSS-only and GSAP-driven motion
 * stay on one timing system.
 */

export const EASE = {
  signal: "power4.out", // exponential ease-out — GSAP eased equivalent of --ease-signal
  linear: "none",
} as const;

export const DURATION = {
  fast: 0.3,
  base: 0.6,
  slow: 1,
  band: 1.1, // full band-composite reveal
} as const;

/** Default ScrollTrigger start/toggle for a reveal-on-scroll section. */
export const REVEAL_SCROLL_TRIGGER = {
  start: "top 80%",
  toggleActions: "play none none reverse",
} as const;
