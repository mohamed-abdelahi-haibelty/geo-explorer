# Design

<!-- impeccable:design-schema 1 -->

## Status

**Token system only.** This pass established the visual world's palette,
type, radius, shadow, and motion tokens in `app/globals.css`, `app/layout.tsx`
and `lib/motion.ts` / `lib/gsap.ts`. No page has been composed against them
yet — `app/page.tsx` is still the pre-existing placeholder. Treat this file
as the contract the first real surface (home, a service page, etc.) must
build against and be re-verified from, not as a description of a finished,
reviewed build.

## Direction

Assigned by `concept-seed.mjs --scope direction --mode persuade` from a
derived shortlist grounded in the audience's own working world (survey/map
cartography, drill core logs, museum mineral cabinets, NI 43-101 technical
reports, remote-sensing/GIS imagery, field-survey notebooks, investor-deck
corporate) and confirmed with the user over the standing "safe consultancy"
default. Beat all six externally-dealt challengers (torn-poster décollage,
bitmap type specimen, WebGL shader portal, darkroom safelight, silk-canopy
color chords, theatrical cyclorama) decisively on audience identification
and product clarity — none of those read as credible to a mining investor
or public institution.

**THESIS.** The site as a live spectral read of the ground — data revealing
structure, not a brochure of claims.

**OWN-WORLD.** White basemap ground. Deep cobalt (`--secondary`, `#021798`)
carries structural/data regions — the "instrument" reading the ground.
Iron-oxide orange (`--primary`, `#E35008`) is the signal an index lights up
when it finds what it's looking for — reserved for action and emphasis, not
spread as decoration. Legend keys, coordinate/mono labels, and banded
content sections are the recurring content pattern this world offers future
pages (article metadata, service line numbering, form field hints).

**STORY.** A visitor should feel like they're watching evidence assemble
itself — bands compositing, structure appearing — rather than being told
about the firm's rigor. This mirrors the firm's own stated position:
"des données traçables et des conclusions qui disent ce que montrent les
résultats" (`PRODUCT.md` → Positioning).

**Why this direction over the map/cartography or core-log candidates
ranked above it in the derived shortlist:** the roll's whole purpose is to
refuse the model's own top-ranked pick, and this direction is genuinely
product-true — "SIG et télédétection" (GIS and remote sensing) is one of
the firm's five real service lines, not a stretch. It also gives the
pinned palette its most literal reading: false-color spectral composites
render iron-oxide alteration zones in exactly this warm-orange-against-
deep-cool-blue relationship in real geoscience software.

## Color

**Strategy: Committed.** White is the ground (per the client's explicit
requirement), but cobalt is not a sprinkle — it's built to carry whole
structural regions (navigation, footer, data-panel sections, sidebar) at
page scale, with orange held back as the signal/accent that marks what
matters (CTAs, key figures, active states, highlighted findings).

| Role | Token | Value | Notes |
|---|---|---|---|
| Ground | `--background` | `oklch(1 0 0)` / `#FFFFFF` | Literal client requirement. |
| Body text | `--foreground` | `oklch(0.19 0.015 264)` | Near-black, cool-tinted for cohesion with secondary. |
| Signal (primary) | `--primary` | `oklch(0.625 0.194 39.8)` / `#E35008` | Exact client hex. Contrast vs. white = 3.88:1 (fails AA body text) — used as a fill, never as text-on-white. |
| Text/icons on primary | `--primary-foreground` | `oklch(0.16 0.02 40)` | Warmed near-black. Contrast vs. `--primary` = 5.0:1 (passes AA). The brand hex itself is never altered to fix contrast — only its paired foreground. |
| Structure (secondary) | `--secondary` | `oklch(0.326 0.2 264.5)` / `#021798` | Exact client hex. Contrast vs. white = 13.3:1. |
| Text on secondary | `--secondary-foreground` | `oklch(0.99 0 0)` | Near-white; passes AA easily. |
| Basemap paper | `--muted` | `oklch(0.97 0.006 90)` | Quiet warm-neutral for alternating sections; still reads as white. |
| Quiet text | `--muted-foreground` | `oklch(0.42 0.015 264)` | 8.5:1 vs. white. |
| Signal wash | `--accent` | `oklch(0.94 0.03 40)` | Light orange tint for hover/selected chips. |
| Text on accent | `--accent-foreground` | `oklch(0.35 0.12 40)` | 9.9:1 vs. `--accent`. |
| Legend/chart 1–5 | `--chart-1..5` | signal, structure, teal, ochre, violet | A map-legend-style qualitative set; each ≥3:1 vs. white for use as graphical (non-text) data. |

Full roles, including borders, inputs, focus rings, sidebar, and the dark
variant, are defined in `app/globals.css`; all derive from the same two
brand hues (39.8° orange, 264.5° blue) rather than a generic gray scale, so
neutrals read as "this system," not a template default.

**Accessibility note:** every text/background pairing above was verified
against WCAG 2.2 AA (4.5:1 body, 3:1 large text/UI) with the actual OKLCH→
sRGB conversion, not eyeballed — see the contrast values in the table.

## Typography

- **Heading — Archivo.** Grotesk with real cartographic/infographic
  lineage (data-journalism and map-legend typography use it); Expanded/Black
  weights give headlines survey-marker confidence without borrowing a
  "trying to look distinctive" AI-default face.
- **Body — Public Sans.** The US federal government's official typeface,
  engineered for long-form legibility and accessibility in official/
  institutional publications — a deliberate echo of the technical-report
  and public-institution register this audience reads daily, and a
  concrete accessibility asset given the WCAG 2.2 AA constraint.
- **Mono — JetBrains Mono.** For legend keys, coordinates, spectral-band
  labels, article metadata, form hints — i.e. actual measurement/data
  content, not "technical" costume.

Loaded via `next/font/google` in `app/layout.tsx` (self-hosted, no runtime
request to Google), exposed as `--font-archivo` / `--font-public-sans` /
`--font-jetbrains-mono`, mapped to Tailwind's `--font-heading` / `--font-sans`
/ `--font-mono` in `app/globals.css`. `h1`–`h6` default to `font-heading`.

## Shape, elevation, motion

- **Radius:** base `--radius: 0.75rem` (12px), so the `lg` step used by
  cards lands at the craft floor's 12–16px minimum; `xl`/`2xl`/`3xl` scale
  up for larger surfaces.
- **Shadows:** `--shadow-xs..xl` are cobalt-tinted (the structural hue),
  multi-layer, with real offset and blur — never a flat colored glow.
- **Motion vocabulary (GSAP):** `lib/gsap.ts` registers `gsap` + `ScrollTrigger`
  + `useGSAP` once, client-only. `lib/motion.ts` holds the shared timing
  system (`EASE.signal = "power4.out"`, mirroring the CSS `--ease-signal`
  token; `DURATION.fast/base/slow/band`; a default `REVEAL_SCROLL_TRIGGER`).
  The world's native motion — not yet built into a page, but the vocabulary
  future sections should draw from — is **layer compositing**: bands
  sweeping/wiping in on scroll, contour or flight-path lines drawing in via
  stroke animation, legend/coordinate markers pinning into place, data
  counters ticking. One authored moment per section, exponential ease-out,
  not scattered identical fades.

## Inherited conventions

- shadcn `base-nova` style, Tailwind v4 `@theme inline`, CSS-variable-driven
  tokens (`components.json`) — unchanged; only the token *values* changed.
  Existing components (`components/ui/button.tsx`) consume semantic tokens
  (`bg-primary`, `text-primary-foreground`, etc.) directly, so they inherit
  the new palette with no component-level edits.
- `--radius`, `--shadow-*`, `--ease-signal` all live in Tailwind's `@theme`
  namespace so they're usable as ordinary utilities (`rounded-lg`,
  `shadow-md`, `ease-signal`), not one-off inline styles.

## Open for the first surface build

- Hero/page composition, imagery (no real photography beyond `logo.jpg` and
  three site photos exists yet — see `PRODUCT.md` → Evidence on Hand),
  component-level motion authorship, and the finish review are unbuilt.
  Re-run this file's contract against the first real surface once it ships.
