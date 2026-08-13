"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

// A lighter stand-in for PublicationPanel: Service has no `status`/
// `publishedAt` at all (it's structural, not a publication — see
// prisma/schema.prisma's ServiceTranslation comment), so the publish/
// unpublish button pair and status badges PublicationPanel builds around
// don't apply. This shows translation completeness instead of publish
// status, and there's no delete flow — only editing the five fixed service
// lines is supported, not creating or removing them.
export function ServiceStatusPanel({
  hasTranslation,
  activeLocale,
  saving,
  saveLabel,
  onSave,
  extra,
}: {
  hasTranslation: Record<LocaleCode, boolean>;
  activeLocale: LocaleCode;
  saving: boolean;
  saveLabel: string;
  onSave: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Traductions</span>
        <ul className="flex flex-col gap-1">
          {LOCALES.map((locale) => (
            <li key={locale} className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{LOCALE_LABELS[locale]}</span>
              <Badge variant={hasTranslation[locale] ? "default" : "outline"} className={hasTranslation[locale] ? undefined : "text-muted-foreground"}>
                {hasTranslation[locale] ? "Renseigné" : "—"}
              </Badge>
            </li>
          ))}
        </ul>
      </div>

      {extra && <div className="border-t border-border pt-3">{extra}</div>}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Enregistrement : {LOCALE_LABELS[activeLocale]}
        </p>
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {saveLabel}
        </p>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
