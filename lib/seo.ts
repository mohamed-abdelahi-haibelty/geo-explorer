import type { LocaleCode } from "@/lib/validation/locale";

// A structural page (Home/About/Services) composed mostly of French-fallback
// content is a duplicate of the French page under a different URL, not a
// genuine translation — per the rule that content untranslated in Arabic
// falls back to French and is noindex for ar. `follow: true` keeps internal
// links (e.g. to a fully-translated sibling page) crawlable.
export function noindexIfFallback(locale: LocaleCode, ...fellBackToFrench: boolean[]) {
  if (locale === "fr") return undefined;
  return fellBackToFrench.some(Boolean) ? { index: false, follow: true } : undefined;
}
