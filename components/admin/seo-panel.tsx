"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LocaleCode } from "@/lib/validation/locale";

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 320;

// Shared by the article and news forms, extracted because the duplication
// was more than superficial — nothing here was ever article-specific except
// the id prefix and the breadcrumb's URL segment, both now parameters.
export function SeoPanel({
  idPrefix,
  section,
  locale,
  metaTitle,
  metaDescription,
  fallbackTitle,
  fallbackDescription,
  slug,
  onMetaTitleChange,
  onMetaDescriptionChange,
}: {
  idPrefix: string;
  section: string;
  locale: LocaleCode;
  metaTitle: string;
  metaDescription: string;
  fallbackTitle: string;
  fallbackDescription: string;
  slug: string;
  onMetaTitleChange: (value: string) => void;
  onMetaDescriptionChange: (value: string) => void;
}) {
  const previewTitle = metaTitle || fallbackTitle || "Titre";
  const previewDescription = metaDescription || fallbackDescription || "Description.";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/40 p-3">
        <p className="truncate text-xs text-muted-foreground">
          geoexplorerservices.com › {locale} › {section} › {slug || "…"}
        </p>
        <p className="truncate text-base text-secondary" dir={locale === "ar" ? "rtl" : "ltr"}>
          {previewTitle}
        </p>
        <p className="line-clamp-2 text-sm text-muted-foreground" dir={locale === "ar" ? "rtl" : "ltr"}>
          {previewDescription}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${idPrefix}-meta-title-${locale}`}>Titre SEO</Label>
          <span className="font-mono text-[11px] text-muted-foreground">
            {metaTitle.length}/{TITLE_MAX}
          </span>
        </div>
        <Input
          id={`${idPrefix}-meta-title-${locale}`}
          value={metaTitle}
          maxLength={TITLE_MAX}
          placeholder={fallbackTitle}
          onChange={(event) => onMetaTitleChange(event.target.value)}
          dir={locale === "ar" ? "rtl" : "ltr"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor={`${idPrefix}-meta-description-${locale}`}>Meta description</Label>
          <span className="font-mono text-[11px] text-muted-foreground">
            {metaDescription.length}/{DESCRIPTION_MAX}
          </span>
        </div>
        <Textarea
          id={`${idPrefix}-meta-description-${locale}`}
          rows={3}
          value={metaDescription}
          maxLength={DESCRIPTION_MAX}
          placeholder={fallbackDescription}
          onChange={(event) => onMetaDescriptionChange(event.target.value)}
          dir={locale === "ar" ? "rtl" : "ltr"}
        />
      </div>
    </div>
  );
}
