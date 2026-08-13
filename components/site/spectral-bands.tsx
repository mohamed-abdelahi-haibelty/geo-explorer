// Decorative geometry, not a picture — the recurring "false-color
// composite" motif this world's motion vocabulary is built around (see
// DESIGN.md's OWN-WORLD/motion notes and lib/motion.ts): plain colored
// bands at varying widths/opacities, real DOM elements so each one can be
// targeted and staggered individually by hero-intro.tsx's GSAP timeline.
// Always aria-hidden — decoration, no information a screen reader needs.
const HERO_BANDS = [
  { color: "var(--secondary)", opacity: 1, flex: 34 },
  { color: "var(--primary)", opacity: 0.92, flex: 9 },
  { color: "var(--secondary)", opacity: 0.6, flex: 15 },
  { color: "var(--chart-3)", opacity: 0.55, flex: 7 },
  { color: "var(--secondary)", opacity: 0.3, flex: 20 },
  { color: "var(--chart-4)", opacity: 0.45, flex: 6 },
  { color: "var(--secondary)", opacity: 0.18, flex: 9 },
];

const QUIET_BANDS = [
  { color: "var(--secondary)", opacity: 0.12, flex: 30 },
  { color: "var(--primary)", opacity: 0.16, flex: 8 },
  { color: "var(--secondary)", opacity: 0.07, flex: 40 },
  { color: "var(--chart-3)", opacity: 0.1, flex: 22 },
];

export function SpectralBandRow({ className, variant = "hero" }: { className?: string; variant?: "hero" | "quiet" }) {
  const bands = variant === "hero" ? HERO_BANDS : QUIET_BANDS;
  return (
    <div aria-hidden="true" className={className} data-spectral-bands>
      {bands.map((band, index) => (
        <div
          key={index}
          {...(variant === "hero" ? { "data-hero-band": true } : {})}
          style={{ flex: band.flex, background: band.color, opacity: band.opacity }}
        />
      ))}
    </div>
  );
}

// A single stroke-drawn contour, the "flight-path line" motif — the
// enclosing [data-hero-line] wrapper lets hero-intro.tsx find the inner
// <path> and animate its stroke-dashoffset on mount.
export function ContourLine({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 400 40" preserveAspectRatio="none" className={className}>
      <path
        d="M0 30 C 40 8, 80 8, 120 22 S 200 36, 240 18 S 320 4, 360 20 S 400 26, 400 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
