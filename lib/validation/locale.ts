import { z } from "zod";

// Mirrors the `Locale` Prisma enum (prisma/schema.prisma) — kept as a
// separate literal tuple, not derived from the generated client, so this
// file has no Prisma import (validation schemas are safe to share with
// client components; server/generated/** is not, per code-standards.md).
export const LOCALES = ["fr", "en", "ar"] as const;
export type LocaleCode = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: LocaleCode = "fr";

export const localeSchema = z.enum(LOCALES);

// { fr: "...", en?: "...", ar?: "..." } — fr is always required since every
// short translated field starts life as the migrated French value
// (prisma/migrations/20260806140000_localisation_schema). EN/AR are filled
// in independently, whenever someone gets to them.
export function localizedTextSchema<T extends z.ZodString>(inner: T) {
  return z.object({
    fr: inner,
    en: inner.optional(),
    ar: inner.optional(),
  });
}

export type LocalizedText = z.infer<ReturnType<typeof localizedTextSchema<z.ZodString>>>;
