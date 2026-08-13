import { z } from "zod";

// Mirrors the `Locale` Prisma enum (prisma/schema.prisma) — kept as a
// separate literal tuple, not derived from the generated client, so this
// file has no Prisma import (validation schemas are safe to share with
// client components; server/generated/** is not).
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

// { fr: string[], en?: string[], ar?: string[] } — for locale-keyed bullet
// lists (ServiceBlock.items). Arrays are never coupled positionally across
// locales: a locale may have a different number of items than fr.
export function localizedStringArraySchema<T extends z.ZodString>(inner: T) {
  return z.object({
    fr: z.array(inner),
    en: z.array(inner).optional(),
    ar: z.array(inner).optional(),
  });
}

export type LocalizedStringArray = z.infer<ReturnType<typeof localizedStringArraySchema<z.ZodString>>>;
