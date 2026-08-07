import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

// Shared by all three root layouts (app/[locale]/layout.tsx,
// app/(admin)/layout.tsx, app/(internal)/layout.tsx) — Task 04a splits the
// single pre-localisation root layout into one per top-level branch (only
// the public [locale] tree needs a per-request `dir`/`lang`), but the fonts
// and base metadata stay identical everywhere, so they're extracted here
// rather than duplicated three times.
export const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Self-hosted (next/font/local, not next/font/google) — already in
// public/fonts/, no network font needed. Only applied on ar (see
// app/[locale]/layout.tsx); Latin glyphs (brand names, numerals) inside
// Arabic content keep falling back to the Latin faces above.
export const thmanyaSans = localFont({
  src: [
    { path: "../public/fonts/thmanyahsans/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/thmanyahsans/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/thmanyahsans/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

export const FONT_VARIABLES = `${archivo.variable} ${publicSans.variable} ${jetbrainsMono.variable}`;

export const SITE_TITLE = "GeoExplorer Services — Géoscience et exploration minière en Mauritanie";
export const SITE_DESCRIPTION =
  "GeoExplorer Services accompagne les acteurs du secteur minier en Mauritanie à chaque étape — de l'exploration à la valorisation durable des ressources.";

// Design-system contract for the public marketing site (see DESIGN.md and
// app/globals.css's token comments) — rendered as a hidden HTML comment on
// the public [locale] layout only; the admin/login/apercu chrome are
// utility screens, not brand surfaces, so they don't carry it.
export const DIRECTION_CONTRACT = `
THESIS: The site as a live spectral read of the ground — data revealing structure, not a brochure of claims.
OWN-WORLD: white basemap ground; deep cobalt (#021798, --secondary) carries structural/data regions; iron-oxide orange (#E35008, --primary) is the signal an index lights up when it finds what it's looking for. Legend keys, coordinate/mono labels, and banded sections throughout.
STORY: the visitor sees the firm's evidence revealing itself — bands compositing, structure appearing — rather than being told about it; mirrors "des données traçables et des conclusions qui disent ce que montrent les résultats."
FIRST VIEWPORT: not yet built — this pass establishes the token system (color, type, radius, shadow, motion) in app/globals.css and the GSAP motion utilities in lib/, not page composition.
FORM: remote-sensing / spectral-imagery system, candidate 5 of the derived shortlist (map/survey, core-log/striplog, museum specimen cabinet, technical-report, remote-sensing, field-notebook, investor-deck), assigned by concept-seed.mjs, confirmed with the user over the safe-default and re-roll alternatives.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
`;
