import type { Locale as PrismaLocale } from "@/prisma/generated/client";

// FR→EN→AR — the admin's own working-language order, used wherever a single
// locale must stand in for "the record" (list-page title, quick actions)
// without an open tab context to disambiguate. Shared by article and news
// translations — both are plain { locale, status } rows, nothing here is
// entity-specific (Task 05 step 1: extract shared pieces).
const LOCALE_PRIORITY: PrismaLocale[] = ["FR", "EN", "AR"];

export function bestTranslation<T extends { locale: PrismaLocale }>(translations: T[]): T | null {
  for (const locale of LOCALE_PRIORITY) {
    const match = translations.find((t) => t.locale === locale);
    if (match) return match;
  }
  return null;
}

// Prefers a PUBLISHED translation (FR→EN→AR); falls back to the first
// existing translation in the same order if nothing is published yet.
// Backs the admin list's/row actions' single-locale quick actions
// (preview link, publish/unpublish) per Task 04a.
export function primaryTranslation<T extends { locale: PrismaLocale; status: string }>(translations: T[]): T | null {
  for (const locale of LOCALE_PRIORITY) {
    const match = translations.find((t) => t.locale === locale && t.status === "PUBLISHED");
    if (match) return match;
  }
  return bestTranslation(translations);
}
