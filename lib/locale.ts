import type { Locale as PrismaLocale } from "@/prisma/generated/client";
import type { LocalizedText, LocaleCode } from "@/lib/validation/locale";

// Two representations, deliberately: the app/URL layer uses lowercase codes
// (next-intl's [locale] segment — "fr"/"en"/"ar"), the DB uses the Prisma
// enum (uppercase, matching every other enum's house style — PublishStatus,
// MediaType…). These two functions are the only place the mapping happens.
export function toDbLocale(locale: LocaleCode): PrismaLocale {
  return locale.toUpperCase() as PrismaLocale;
}

export function fromDbLocale(locale: PrismaLocale): LocaleCode {
  return locale.toLowerCase() as LocaleCode;
}

// Structural content (PageSection, Service) must exist in all three locales;
// a missing translation falls back to French rather than a blank page. This
// is deliberately NOT used for publications (Article/News) — those are
// independent per locale, see architecture.md's locale invariants.
export function resolveStructural<T extends { locale: PrismaLocale }>(
  rows: T[],
  locale: LocaleCode,
): { row: T | null; isFallback: boolean } {
  const target = toDbLocale(locale);
  const exact = rows.find((row) => row.locale === target);
  if (exact) return { row: exact, isFallback: false };
  const fr = rows.find((row) => row.locale === "FR");
  return { row: fr ?? null, isFallback: fr != null };
}

// Author.title/bio, Tag.name, Partner.category, MediaAsset.alt/caption —
// short strings stored as {fr, en?, ar?} JSON (see architecture.md's
// storage-strategy table). `fallback` lets a picker show *something* rather
// than an empty string when the active locale's value hasn't been written
// yet; pass `false` (the default) where an empty result is meaningful
// (e.g. deciding whether an EN label still needs writing).
export function pickLocalizedText(
  value: unknown,
  locale: LocaleCode,
  { fallback = true }: { fallback?: boolean } = {},
): string {
  const text = value as LocalizedText | null | undefined;
  if (!text || typeof text !== "object") return "";
  const own = text[locale];
  if (typeof own === "string" && own.length > 0) return own;
  if (!fallback) return "";
  return typeof text.fr === "string" ? text.fr : "";
}
