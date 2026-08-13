import type { LocaleCode } from "@/lib/validation/locale";

const UNIT: Record<LocaleCode, { kb: string; mb: string }> = {
  fr: { kb: "Ko", mb: "Mo" },
  en: { kb: "KB", mb: "MB" },
  ar: { kb: "كيلوبايت", mb: "ميغابايت" },
};

// A locale-aware sibling of lib/media-client.ts's formatBytes (French-only,
// admin-facing) — the article PDF's size is public, trilingual copy.
export function formatFileSize(bytes: number, locale: LocaleCode): string {
  const unit = UNIT[locale];
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} ${unit.kb}`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} ${unit.mb}`;
}
