import type { PageKey } from "@/prisma/generated/client";

// Shared by /admin/pages (index) and /admin/pages/[page] (editor) — the
// slug↔PageKey mapping and the French label, both needed by both routes.
// GLOBAL carries the mentions-légales section — its one seeded row.
export const PAGE_SLUG_TO_KEY: Record<string, PageKey> = {
  accueil: "HOME",
  "a-propos": "ABOUT",
  services: "SERVICES",
  contact: "CONTACT",
  "mentions-legales": "GLOBAL",
};

export const PAGE_KEY_TO_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PAGE_SLUG_TO_KEY).map(([slug, key]) => [key, slug]),
);

export const PAGE_LABEL: Record<string, string> = {
  HOME: "Accueil",
  ABOUT: "À propos",
  SERVICES: "Services",
  CONTACT: "Contact",
  GLOBAL: "Mentions légales",
};

// Section-level labels for the /admin/pages/[page] editor's per-key cards.
export const SECTION_LABEL: Record<string, string> = {
  "HOME:hero": "Bannière principale",
  "HOME:values": "Valeurs",
  "HOME:whoWeAre": "Qui sommes-nous",
  "HOME:expertiseTeaser": "Introduction aux expertises",
  "HOME:strengths": "Pourquoi GeoExplorer",
  "HOME:partnersTeaser": "Introduction partenaires",
  "HOME:closingBanner": "Bannière de clôture",
  "ABOUT:intro": "Introduction",
  "ABOUT:mission": "Mission",
  "ABOUT:vision": "Vision",
  "ABOUT:strengths": "Ce qui nous distingue",
  "ABOUT:team": "Équipe",
  "ABOUT:approach": "Notre méthode",
  "ABOUT:referenceDomains": "Domaines de référence",
  "SERVICES:intro": "Introduction",
  "CONTACT:hero": "Bannière principale",
  "CONTACT:formIntro": "Introduction au formulaire",
  "CONTACT:projectTypes": "Types de projet",
  "GLOBAL:legal": "Mentions légales",
};
