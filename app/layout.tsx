import type { Metadata } from "next";
import { Archivo, Public_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GeoExplorer Services — Géoscience et exploration minière en Mauritanie",
  description:
    "GeoExplorer Services accompagne les acteurs du secteur minier en Mauritanie à chaque étape — de l'exploration à la valorisation durable des ressources.",
};

const DIRECTION_CONTRACT = `
THESIS: The site as a live spectral read of the ground — data revealing structure, not a brochure of claims.
OWN-WORLD: white basemap ground; deep cobalt (#021798, --secondary) carries structural/data regions; iron-oxide orange (#E35008, --primary) is the signal an index lights up when it finds what it's looking for. Legend keys, coordinate/mono labels, and banded sections throughout.
STORY: the visitor sees the firm's evidence revealing itself — bands compositing, structure appearing — rather than being told about it; mirrors "des données traçables et des conclusions qui disent ce que montrent les résultats."
FIRST VIEWPORT: not yet built — this pass establishes the token system (color, type, radius, shadow, motion) in app/globals.css and the GSAP motion utilities in lib/, not page composition.
FORM: remote-sensing / spectral-imagery system, candidate 5 of the derived shortlist (map/survey, core-log/striplog, museum specimen cabinet, technical-report, remote-sensing, field-notebook, investor-deck), assigned by concept-seed.mjs, confirmed with the user over the safe-default and re-roll alternatives.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md.
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${archivo.variable} ${publicSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          hidden
          dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }}
        />
        {children}
      </body>
    </html>
  );
}
