import type { LocaleCode } from "@/lib/validation/locale";

// Matches the CASE in the search_vector trigger
// (prisma/migrations/20260806140100_localisation_raw_sql) — the tsvector
// columns on both ArticleTranslation and NewsTranslation were built with
// this per-locale dictionary, so every query side (article search, news
// search, the combined recherche/ search) has to ask in the same one for
// stemming to line up.
export const TS_SEARCH_CONFIG: Record<LocaleCode, "french" | "english" | "arabic"> = {
  fr: "french",
  en: "english",
  ar: "arabic",
};
