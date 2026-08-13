import type { IconName } from "lucide-react/dynamic";

// A curated allowlist, not the full ~1500-name lucide catalog — the five
// names already seeded (prisma/seed.ts) plus a modest geoscience-relevant
// set. Free-text would let a typo silently render nothing; validated in
// lib/validation/services.ts against this same list.
//
// Lives outside icon-picker.tsx (a "use client" file) on purpose:
// lib/validation/services.ts imports this for server-side Zod validation,
// and importing a plain value from a "use client" module into server code
// resolves to a client reference, not the real array — z.enum() then sees
// an empty option list and rejects every icon. Plain module, no directive,
// importable from both sides of the boundary.
export const SERVICE_ICON_NAMES = [
  "mountain",
  "settings",
  "map",
  "leaf",
  "graduation-cap",
  "compass",
  "drill",
  "layers",
  "flask-conical",
  "database",
  "shield-check",
  "users",
  "book-open",
  "hard-hat",
  "pickaxe",
  "microscope",
  "satellite",
  "waves",
] as const satisfies readonly IconName[];
