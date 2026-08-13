"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { SeoPanel } from "@/components/admin/seo-panel";
import { ServiceStatusPanel } from "@/components/admin/service-status-panel";
import { ServiceBlocksEditor, type ServiceBlockDraft } from "@/components/admin/service-blocks-editor";
import { IconPicker } from "@/components/admin/icon-picker";
import { updateServiceAction } from "@/server/actions/services";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { LocalizedText, LocalizedStringArray } from "@/lib/validation/locale";
import type { MediaAsset } from "@/prisma/generated/client";
import type { getServiceForEdit } from "@/server/queries/services";

type ServiceForEdit = NonNullable<Awaited<ReturnType<typeof getServiceForEdit>>>;
type Translation = ServiceForEdit["translations"][number];

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

function blocksFromService(service: ServiceForEdit): ServiceBlockDraft[] {
  return service.blocks.map((block) => ({
    key: block.id,
    id: block.id,
    title: (block.title as LocalizedText | null) ?? {},
    items: (block.items as LocalizedStringArray | null) ?? {},
  }));
}

type TranslationDraft = {
  translationId: string | null;
  title: string;
  tagline: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  lastKnownUpdatedAt: string | null;
  dirty: boolean;
  saving: boolean;
  conflict: { updatedAt: string } | null;
  saveLabel: string;
};

function emptyDraft(): TranslationDraft {
  return {
    translationId: null,
    title: "",
    tagline: "",
    summary: "",
    metaTitle: "",
    metaDescription: "",
    lastKnownUpdatedAt: null,
    dirty: false,
    saving: false,
    conflict: null,
    saveLabel: "Aucun contenu pour cette langue.",
  };
}

function draftFromTranslation(t: Translation): TranslationDraft {
  return {
    translationId: t.id,
    title: t.title,
    tagline: t.tagline ?? "",
    summary: t.summary ?? "",
    metaTitle: t.metaTitle ?? "",
    metaDescription: t.metaDescription ?? "",
    lastKnownUpdatedAt: t.updatedAt.toISOString(),
    dirty: false,
    saving: false,
    conflict: null,
    saveLabel: "Toutes les modifications sont enregistrées.",
  };
}

function draftsFromService(service: ServiceForEdit): Record<LocaleCode, TranslationDraft> {
  const result = {} as Record<LocaleCode, TranslationDraft>;
  for (const locale of LOCALES) {
    const dbLocale = locale.toUpperCase();
    const translation = service.translations.find((t) => t.locale === dbLocale);
    result[locale] = translation ? draftFromTranslation(translation) : emptyDraft();
  }
  return result;
}

export function ServiceForm({ service }: { service: ServiceForEdit }) {
  const [drafts, setDrafts] = useState<Record<LocaleCode, TranslationDraft>>(() => draftsFromService(service));
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("fr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Locale-independent — icon, hero image, published, blocks (block order
  // and existence; block title/items text stays per-locale, see
  // ServiceBlocksEditor) — resubmitted on every locale save, same rule
  // News's cover/gallery follow.
  const [icon, setIcon] = useState(service.icon ?? "mountain");
  const [hero, setHero] = useState<MediaAsset | null>(service.hero);
  const [published, setPublished] = useState(service.published);
  const [blocks, setBlocks] = useState<ServiceBlockDraft[]>(() => blocksFromService(service));

  function updateDraft(locale: LocaleCode, patch: Partial<TranslationDraft>) {
    setDrafts((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  function markDirty(locale: LocaleCode) {
    updateDraft(locale, { dirty: true, saveLabel: "Modifications non enregistrées." });
  }

  const draft = drafts[activeLocale];

  async function performSave(locale: LocaleCode, opts: { force?: boolean } = {}) {
    const current = drafts[locale];
    if (!current.title.trim()) {
      setErrorMessage("Le titre est obligatoire avant d'enregistrer.");
      return;
    }

    updateDraft(locale, { saving: true });
    setErrorMessage(null);

    const result = await updateServiceAction({
      serviceId: service.id,
      locale,
      translationId: current.translationId ?? undefined,
      title: current.title.trim(),
      tagline: current.tagline.trim() || undefined,
      summary: current.summary.trim() || undefined,
      metaTitle: current.metaTitle.trim() || undefined,
      metaDescription: current.metaDescription.trim() || undefined,
      icon,
      heroId: hero?.id,
      published,
      blocks: blocks.map((block) => ({ id: block.id ?? undefined, title: block.title, items: block.items })),
      updatedAt: current.lastKnownUpdatedAt ?? undefined,
      force: opts.force,
    });

    if (result.ok) {
      updateDraft(locale, {
        translationId: result.data.translationId,
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

  const hasTranslation: Record<LocaleCode, boolean> = {
    fr: Boolean(drafts.fr.translationId),
    en: Boolean(drafts.en.translationId),
    ar: Boolean(drafts.ar.translationId),
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-5">
        <Tabs value={activeLocale} onValueChange={(value) => setActiveLocale(value as LocaleCode)}>
          <TabsList>
            {LOCALES.map((locale) => (
              <TabsTrigger key={locale} value={locale}>
                {LOCALE_LABELS[locale]}
                {!drafts[locale].translationId && <span className="ml-1 text-muted-foreground">—</span>}
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
            <div key={locale} className={hidden ? "hidden" : "flex flex-col gap-5"} aria-hidden={hidden}>
              {d.conflict && (
                <div
                  role="alert"
                  className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-foreground">Ce service a été modifié ailleurs depuis son chargement.</span>
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

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`service-title-${locale}`}>
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`service-title-${locale}`}
                  value={d.title}
                  onChange={(event) => updateDraft(locale, { title: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className="h-11 text-lg font-medium"
                  placeholder="Titre du service"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`service-tagline-${locale}`}>Accroche</Label>
                <Input
                  id={`service-tagline-${locale}`}
                  value={d.tagline}
                  onChange={(event) => updateDraft(locale, { tagline: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  placeholder="Phrase en italique de la plaquette"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`service-summary-${locale}`}>Résumé</Label>
                <Textarea
                  id={`service-summary-${locale}`}
                  rows={4}
                  value={d.summary}
                  onChange={(event) => updateDraft(locale, { summary: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  placeholder="Texte affiché sur l'accueil"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contenu détaillé</CardTitle>
                </CardHeader>
                <CardContent>
                  <ServiceBlocksEditor
                    blocks={blocks}
                    activeLocale={locale}
                    onChange={(next) => {
                      setBlocks(next);
                      markDirty(locale);
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <SeoPanel
                    idPrefix="service"
                    section="services"
                    locale={locale}
                    metaTitle={d.metaTitle}
                    metaDescription={d.metaDescription}
                    fallbackTitle={d.title}
                    fallbackDescription={d.summary}
                    slug={service.slug}
                    onMetaTitleChange={(value) => updateDraft(locale, { metaTitle: value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                    onMetaDescriptionChange={(value) =>
                      updateDraft(locale, { metaDescription: value, dirty: true, saveLabel: "Modifications non enregistrées." })
                    }
                  />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <ServiceStatusPanel
          hasTranslation={hasTranslation}
          activeLocale={activeLocale}
          saving={draft.saving}
          saveLabel={draft.saveLabel}
          onSave={() => performSave(activeLocale)}
          extra={
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="service-published" className="flex flex-col gap-0.5">
                <span>Publié</span>
                <span className="text-xs font-normal text-muted-foreground">Visible sur le site public</span>
              </Label>
              <Switch
                id="service-published"
                checked={published}
                onCheckedChange={(value) => {
                  setPublished(value);
                  markDirty(activeLocale);
                }}
              />
            </div>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Icône</CardTitle>
          </CardHeader>
          <CardContent>
            <IconPicker
              value={icon}
              onChange={(value) => {
                setIcon(value);
                markDirty(activeLocale);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Image principale</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              {hero ? (
                <CldImage publicId={hero.publicId} alt="" fill sizes="320px" blurDataUrl={hero.blurDataUrl} />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <ImagePlus aria-hidden="true" className="size-6" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <MediaPicker
                accept={["IMAGE"]}
                trigger={
                  <Button type="button" variant="outline" size="sm" className="flex-1">
                    {hero ? "Changer" : "Choisir une image"}
                  </Button>
                }
                onSelect={(assets) => {
                  setHero(assets[0] ?? null);
                  markDirty(activeLocale);
                }}
              />
              {hero && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHero(null);
                    markDirty(activeLocale);
                  }}
                >
                  Retirer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
