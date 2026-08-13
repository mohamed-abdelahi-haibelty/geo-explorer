import type { LocaleCode } from "@/lib/validation/locale";

const INTL_LOCALE: Record<LocaleCode, string> = { fr: "fr-FR", en: "en-US", ar: "ar" };

export function formatDate(date: Date | string, locale: LocaleCode): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: "numeric", month: "long", year: "numeric" }).format(value);
}
