import { defineRouting } from "next-intl/routing";
import { LOCALES, DEFAULT_LOCALE } from "@/lib/validation/locale";

// `localePrefix: "always"` — a prefix on every public URL, including the
// default locale (`/fr/...`, never bare `/...`), per Task 04a's decision.
// `localeDetection: false` — next-intl's own cookie/Accept-Language sniffing
// is disabled; proxy.ts implements the exact resolved behavior instead
// ("cookie-if-set, else fr", never Accept-Language) with a small manual
// check before delegating here. next-intl still *writes* the NEXT_LOCALE
// cookie on every response to match whichever locale-prefixed page the
// visitor is actually on — only the read side is replaced.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  localeDetection: false,
  // next-intl's default `Link` response header advertises all three locales
  // unconditionally for every URL — correct for structural pages (always
  // exist in all locales, falling back to FR), wrong for publications
  // (Article/News), where a locale with no translation must not be
  // advertised at all (Task 04a). Per-page <link rel="alternate"> tags via
  // generateMetadata's `alternates.languages`, built from each page's own
  // actual available-locale set, are the single source of truth instead.
  alternateLinks: false,
});
