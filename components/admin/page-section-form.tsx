"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { SectionFieldRenderer } from "@/components/admin/section-field-renderer";
import { saveSectionAction } from "@/server/actions/page-sections";
import { getSectionSchema, sectionFieldSpecs, sectionFallbacks, normalizeSectionData, type SectionKey } from "@/lib/validation/sections";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { PageKey, PageSection } from "@/prisma/generated/client";

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

type ImageLite = { id: string; publicId: string; blurDataUrl: string | null };

type SectionDraft = {
  id: string | null;
  data: Record<string, unknown>;
  published: boolean;
  lastKnownUpdatedAt: string | null;
  dirty: boolean;
  saving: boolean;
  conflict: { updatedAt: string } | null;
  saveLabel: string;
};

function draftFromRow(row: PageSection | undefined, page: string, key: string): SectionDraft {
  const fallback = sectionFallbacks[`${page}:${key}` as SectionKey] as Record<string, unknown>;
  if (!row) {
    return {
      id: null,
      data: fallback,
      published: true,
      lastKnownUpdatedAt: null,
      dirty: false,
      saving: false,
      conflict: null,
      saveLabel: "Aucun contenu pour cette langue.",
    };
  }
  const schema = getSectionSchema(page, key);
  const parsed = schema?.safeParse(row.data);
  return {
    id: row.id,
    data: (parsed?.success ? parsed.data : fallback) as Record<string, unknown>,
    published: row.published,
    lastKnownUpdatedAt: row.updatedAt.toISOString(),
    dirty: false,
    saving: false,
    conflict: null,
    saveLabel: "Toutes les modifications sont enregistrées.",
  };
}

// One (page, key) group, FR/EN/AR tabs — the per-section building block
// /admin/pages/[page] stacks one of per section key. Manual save per locale
// tab (not News's 30s autosave): sections are short structured fields, not a
// long rich-text writing session, so the autosave's crash-protection isn't
// earning the added complexity here — but the conflict check and
// never-lose-input contract still apply.
export function PageSectionForm({
  page,
  sectionKey,
  label,
  rows,
  images,
}: {
  page: PageKey;
  sectionKey: string;
  label: string;
  rows: PageSection[];
  images: Record<string, ImageLite>;
}) {
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("fr");
  const [drafts, setDrafts] = useState<Record<LocaleCode, SectionDraft>>(() => {
    const result = {} as Record<LocaleCode, SectionDraft>;
    for (const locale of LOCALES) {
      const row = rows.find((r) => r.locale === locale.toUpperCase());
      result[locale] = draftFromRow(row, page, sectionKey);
    }
    return result;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fields = sectionFieldSpecs[`${page}:${sectionKey}` as SectionKey];

  function updateDraft(locale: LocaleCode, patch: Partial<SectionDraft>) {
    setDrafts((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  async function performSave(locale: LocaleCode, opts: { force?: boolean } = {}) {
    const current = drafts[locale];
    updateDraft(locale, { saving: true });
    setErrorMessage(null);

    const result = await saveSectionAction({
      page,
      key: sectionKey,
      locale,
      published: current.published,
      data: normalizeSectionData(page, sectionKey, current.data),
      updatedAt: current.lastKnownUpdatedAt ?? undefined,
      force: opts.force,
    });

    if (result.ok) {
      updateDraft(locale, {
        id: result.data.id,
        lastKnownUpdatedAt: result.data.updatedAt,
        dirty: false,
        saving: false,
        conflict: null,
        saveLabel: `Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
      });
    } else {
      updateDraft(locale, { saving: false });
      if (result.code === "CONFLICT") {
        updateDraft(locale, {
          conflict: { updatedAt: result.fields?.updatedAt ?? new Date().toISOString() },
          saveLabel: "Conflit détecté — enregistrement en pause.",
        });
      } else {
        setErrorMessage(result.message);
      }
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <CardTitle className="text-sm">{label}</CardTitle>
        <div className="flex items-center gap-1.5">
          {LOCALES.map((locale) => (
            <Badge key={locale} variant={drafts[locale].id ? "default" : "outline"} className="px-1.5 text-[10px]">
              {locale.toUpperCase()}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as LocaleCode)}>
          <TabsList>
            {LOCALES.map((locale) => (
              <TabsTrigger key={locale} value={locale}>
                {LOCALE_LABELS[locale]}
                {!drafts[locale].id && <span className="ml-1 text-muted-foreground">—</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {LOCALES.map((locale) => {
          const d = drafts[locale];
          const hidden = locale !== activeLocale;
          return (
            <div key={locale} className={hidden ? "hidden" : "flex flex-col gap-4"} aria-hidden={hidden}>
              {d.conflict && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-foreground">Cette section a été modifiée ailleurs depuis son chargement.</span>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
                      Recharger la page
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => performSave(locale, { force: true })}>
                      Enregistrer quand même
                    </Button>
                  </div>
                </div>
              )}

              <SectionFieldRenderer
                idPrefix={`section-${page}-${sectionKey}-${locale}`}
                fields={fields}
                data={d.data}
                images={images}
                locale={locale}
                onChange={(next) => updateDraft(locale, { data: next, dirty: true, saveLabel: "Modifications non enregistrées." })}
              />

              <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                <Label htmlFor={`section-${page}-${sectionKey}-${locale}-published`} className="flex flex-col gap-0.5">
                  <span>Publiée</span>
                  <span className="text-xs font-normal text-muted-foreground">Visible sur le site public dans cette langue</span>
                </Label>
                <Switch
                  id={`section-${page}-${sectionKey}-${locale}-published`}
                  checked={d.published}
                  onCheckedChange={(value) => updateDraft(locale, { published: value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
                  {d.saveLabel}
                </p>
                <Button type="button" size="sm" onClick={() => performSave(locale)} disabled={d.saving || d.conflict !== null}>
                  {d.saving ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
