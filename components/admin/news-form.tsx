"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { SeoPanel } from "@/components/admin/seo-panel";
import { PublicationPanel, type LocalePublicationSummary } from "@/components/admin/publication-panel";
import { NewsGalleryEditor, type NewsGalleryItem } from "@/components/admin/news-gallery-editor";
import ArticleEditor from "@/components/editor/article-editor-dynamic";
import type { ArticleEditorHandle } from "@/components/editor/article-editor";
import {
  createNewsAction,
  createNewsTranslationAction,
  deleteNewsAction,
  getNewsForEditAction,
  publishNewsAction,
  unpublishNewsAction,
  updateNewsAction,
} from "@/server/actions/news";
import { slugify } from "@/lib/slug";
import { pickLocalizedText } from "@/lib/locale";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { JSONContent } from "@tiptap/core";
import type { MediaAsset, PublishStatus } from "@/prisma/generated/client";
import type { getNewsForEdit } from "@/server/queries/news";

type NewsForEdit = NonNullable<Awaited<ReturnType<typeof getNewsForEdit>>>;
type Translation = NewsForEdit["translations"][number];

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

function toGalleryItem(row: NewsForEdit["media"][number]): NewsGalleryItem {
  return {
    mediaId: row.media.id,
    type: row.media.type,
    publicId: row.media.publicId,
    blurDataUrl: row.media.blurDataUrl,
    alt: row.media.type === "IMAGE" ? pickLocalizedText(row.media.alt, "fr") : "",
    caption: (row.caption as Partial<Record<LocaleCode, string>>) ?? {},
  };
}

function toEventDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

type TranslationDraft = {
  translationId: string | null;
  title: string;
  slug: string;
  slugTouched: boolean;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  status: PublishStatus;
  publishedAt: Date | null;
  lastKnownUpdatedAt: string | null;
  initialContent: JSONContent | null;
  dirty: boolean;
  saving: boolean;
  conflict: { updatedAt: string } | null;
  saveLabel: string;
};

// The text fields the admin types into — compared before and after a save to
// tell whether anything changed while the request was in flight.
const EDITABLE_FIELDS = ["title", "slug", "excerpt", "metaTitle", "metaDescription"] as const;

function emptyDraft(): TranslationDraft {
  return {
    translationId: null,
    title: "",
    slug: "",
    slugTouched: false,
    excerpt: "",
    metaTitle: "",
    metaDescription: "",
    status: "DRAFT",
    publishedAt: null,
    lastKnownUpdatedAt: null,
    initialContent: null,
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
    slug: t.slug,
    slugTouched: true,
    excerpt: t.excerpt ?? "",
    metaTitle: t.metaTitle ?? "",
    metaDescription: t.metaDescription ?? "",
    status: t.status,
    publishedAt: t.publishedAt,
    lastKnownUpdatedAt: t.updatedAt.toISOString(),
    initialContent: t.contentJson as JSONContent,
    dirty: false,
    saving: false,
    conflict: null,
    saveLabel: "Toutes les modifications sont enregistrées.",
  };
}

function draftsFromNews(news: NewsForEdit | null): Record<LocaleCode, TranslationDraft> {
  const result = {} as Record<LocaleCode, TranslationDraft>;
  for (const locale of LOCALES) {
    const dbLocale = locale.toUpperCase();
    const translation = news?.translations.find((t) => t.locale === dbLocale);
    result[locale] = translation ? draftFromTranslation(translation) : emptyDraft();
  }
  return result;
}

export function NewsForm({ news }: { news: NewsForEdit | null }) {
  const router = useRouter();
  const editorRefFr = useRef<ArticleEditorHandle>(null);
  const editorRefEn = useRef<ArticleEditorHandle>(null);
  const editorRefAr = useRef<ArticleEditorHandle>(null);
  const editorRefs: Record<LocaleCode, React.RefObject<ArticleEditorHandle | null>> = {
    fr: editorRefFr,
    en: editorRefEn,
    ar: editorRefAr,
  };

  const [newsId, setNewsId] = useState(news?.id ?? null);
  const [drafts, setDrafts] = useState<Record<LocaleCode, TranslationDraft>>(() => draftsFromNews(news));
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("fr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Locale-independent — cover, event date/location, external video,
  // gallery — edited once regardless of which locale tab is active. Gallery
  // captions are the one exception: shared list, per-locale
  // text — see NewsGalleryEditor.
  const [cover, setCover] = useState<MediaAsset | null>(news?.cover ?? null);
  const [eventDate, setEventDate] = useState(toEventDateInput(news?.eventDate ?? null));
  const [location, setLocation] = useState(news?.location ?? "");
  const [externalVideoUrl, setExternalVideoUrl] = useState(news?.externalVideoUrl ?? "");
  const [gallery, setGallery] = useState<NewsGalleryItem[]>(news?.media.map(toGalleryItem) ?? []);

  function updateDraft(locale: LocaleCode, patch: Partial<TranslationDraft>) {
    setDrafts((prev) => ({ ...prev, [locale]: { ...prev[locale], ...patch } }));
  }

  function markDirty(locale: LocaleCode) {
    updateDraft(locale, { dirty: true, saveLabel: "Modifications non enregistrées." });
  }

  function markActiveDirty() {
    markDirty(activeLocale);
  }

  const draft = drafts[activeLocale];

  async function performSave(locale: LocaleCode, opts: { force?: boolean } = {}): Promise<TranslationDraft | null> {
    const current = drafts[locale];
    if (!current.title.trim()) {
      setErrorMessage("Le titre est obligatoire avant d'enregistrer.");
      return null;
    }
    if (current.translationId && !current.dirty && !opts.force) return current;

    updateDraft(locale, { saving: true });
    setErrorMessage(null);
    setVideoUrlError(null);

    const payload = {
      locale,
      title: current.title.trim(),
      slug: current.slug.trim() || undefined,
      excerpt: current.excerpt.trim() || undefined,
      contentJson: editorRefs[locale].current?.getJSON() ?? ({ type: "doc", content: [] } as JSONContent),
      metaTitle: current.metaTitle.trim() || undefined,
      metaDescription: current.metaDescription.trim() || undefined,
      coverId: cover?.id,
      eventDate: eventDate || undefined,
      location: location.trim() || undefined,
      externalVideoUrl: externalVideoUrl.trim() || undefined,
      media: gallery.map((item) => ({ mediaId: item.mediaId, caption: item.caption })),
    };

    const result = current.translationId
      ? await updateNewsAction({
          translationId: current.translationId,
          updatedAt: current.lastKnownUpdatedAt!,
          force: opts.force,
          ...payload,
        })
      : newsId
        ? await createNewsTranslationAction({ newsId, ...payload })
        : await createNewsAction(payload);

    if (result.ok) {
      if (!newsId) setNewsId(result.data.newsId);
      const nextDraft: TranslationDraft = {
        ...current,
        translationId: result.data.translationId,
        slug: result.data.slug,
        status: result.data.status as PublishStatus,
        lastKnownUpdatedAt: result.data.updatedAt,
        dirty: false,
        saving: false,
        conflict: null,
        saveLabel: `Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`,
      };
      // Merge onto the latest state, not onto the pre-request snapshot — see
      // the fuller note in ArticleForm: writing `current` back wholesale
      // reverted anything typed while the save was in flight.
      setDrafts((prev) => {
        const latest = prev[locale];
        const editedDuringSave = EDITABLE_FIELDS.some((field) => latest[field] !== current[field]);
        return {
          ...prev,
          [locale]: {
            ...latest,
            translationId: nextDraft.translationId,
            slug: latest.slug === current.slug ? nextDraft.slug : latest.slug,
            status: nextDraft.status,
            lastKnownUpdatedAt: nextDraft.lastKnownUpdatedAt,
            dirty: editedDuringSave,
            saving: false,
            conflict: null,
            saveLabel: editedDuringSave ? "Modifications non enregistrées." : nextDraft.saveLabel,
          },
        };
      });
      if (!news && !newsId) {
        // Same reason as ArticleForm: navigating here would remount the form
        // on the first save and discard whatever was being typed.
        window.history.replaceState(null, "", `/admin/actualites/${result.data.newsId}`);
      }
      return nextDraft;
    }

    updateDraft(locale, { saving: false });
    if (result.code === "CONFLICT") {
      updateDraft(locale, {
        conflict: { updatedAt: result.fields?.updatedAt ?? new Date().toISOString() },
        saveLabel: "Conflit détecté — rechargez ou forcez l'enregistrement.",
      });
    } else {
      setErrorMessage(result.message);
      if (result.fields?.slug) updateDraft(locale, { saveLabel: "Le slug est verrouillé après la première publication." });
      if (result.fields?.externalVideoUrl) setVideoUrlError(result.fields.externalVideoUrl);
    }
    return null;
  }

  // Nothing saves on its own any more, so warn before the tab closes or the
  // browser navigates away while a locale still holds unsaved edits. Does not
  // cover in-app <Link> navigation — the browser gives no hook for that.
  const hasUnsavedChanges = LOCALES.some((locale) => drafts[locale].dirty);
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);


  async function handleReloadNewer(locale: LocaleCode) {
    if (!newsId) return;
    const result = await getNewsForEditAction(newsId);
    if (!result.ok || !result.data) {
      setErrorMessage(result.ok ? "Actualité introuvable." : result.message);
      return;
    }
    const fresh = result.data;
    const dbLocale = locale.toUpperCase();
    const freshTranslation = fresh.translations.find((t) => t.locale === dbLocale);
    setDrafts((prev) => ({
      ...prev,
      [locale]: {
        ...(freshTranslation ? draftFromTranslation(freshTranslation) : emptyDraft()),
        saveLabel: "Version la plus récente rechargée.",
      },
    }));
    editorRefs[locale].current?.setContent((freshTranslation?.contentJson as JSONContent | undefined) ?? { type: "doc", content: [] });

    setCover(fresh.cover);
    setEventDate(toEventDateInput(fresh.eventDate));
    setLocation(fresh.location ?? "");
    setExternalVideoUrl(fresh.externalVideoUrl ?? "");
    setGallery(fresh.media.map(toGalleryItem));
  }

  async function handlePublish() {
    const saved = await performSave(activeLocale);
    if (!saved?.translationId) return;
    setPublishing(true);
    const result = await publishNewsAction(saved.translationId);
    setPublishing(false);
    // lastKnownUpdatedAt must follow the publish write too, or the next
    // save sends a timestamp the server has already moved past and the
    // form reports a conflict against a change this same client made.
    if (result.ok)
      updateDraft(activeLocale, {
        status: "PUBLISHED",
        publishedAt: new Date(),
        lastKnownUpdatedAt: result.data.updatedAt,
      });
    else setErrorMessage(result.message);
  }

  async function handleUnpublish() {
    const translationId = drafts[activeLocale].translationId;
    if (!translationId) return;
    setPublishing(true);
    const result = await unpublishNewsAction(translationId);
    setPublishing(false);
    if (result.ok) updateDraft(activeLocale, { status: "DRAFT", lastKnownUpdatedAt: result.data.updatedAt });
    else setErrorMessage(result.message);
  }

  async function handleDelete() {
    if (!newsId) return;
    const result = await deleteNewsAction(newsId);
    if (result.ok) router.push("/admin/actualites");
    else setErrorMessage(result.message);
  }

  const summaries: Record<LocaleCode, LocalePublicationSummary> = {
    fr: { status: drafts.fr.status, translationId: drafts.fr.translationId },
    en: { status: drafts.en.status, translationId: drafts.en.translationId },
    ar: { status: drafts.ar.status, translationId: drafts.ar.translationId },
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
                <div role="alert" className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-foreground">
                    Cette traduction a été modifiée ailleurs depuis son chargement.
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => handleReloadNewer(locale)}>
                      Recharger la version récente
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => performSave(locale, { force: true })}>
                      Enregistrer quand même
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`news-title-${locale}`}>
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`news-title-${locale}`}
                  value={d.title}
                  onChange={(event) => {
                    const nextTitle = event.target.value;
                    updateDraft(locale, {
                      title: nextTitle,
                      slug: !d.slugTouched ? slugify(nextTitle) : d.slug,
                      dirty: true,
                      saveLabel: "Modifications non enregistrées.",
                    });
                  }}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  className="h-11 text-lg font-medium"
                  placeholder="Titre de l'actualité"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`news-slug-${locale}`}>Slug</Label>
                  {Boolean(d.publishedAt) && <Lock aria-hidden="true" className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  id={`news-slug-${locale}`}
                  value={d.slug}
                  disabled={Boolean(d.publishedAt)}
                  onChange={(event) =>
                    updateDraft(locale, { slug: event.target.value, slugTouched: true, dirty: true, saveLabel: "Modifications non enregistrées." })
                  }
                  className="font-mono text-sm"
                  aria-describedby={`news-slug-hint-${locale}`}
                />
                <p id={`news-slug-hint-${locale}`} className="text-xs text-muted-foreground">
                  {d.publishedAt
                    ? "Verrouillé — cette traduction a déjà été publiée."
                    : "Généré depuis le titre, modifiable jusqu'à la première publication."}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`news-excerpt-${locale}`}>Extrait</Label>
                <Textarea
                  id={`news-excerpt-${locale}`}
                  rows={3}
                  value={d.excerpt}
                  onChange={(event) => updateDraft(locale, { excerpt: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  placeholder="Généré automatiquement depuis le corps de l'actualité si laissé vide"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Corps de l&apos;actualité</Label>
                <ArticleEditor
                  ref={editorRefs[locale]}
                  initialContent={d.initialContent}
                  onDirty={() => markDirty(locale)}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">SEO</CardTitle>
                </CardHeader>
                <CardContent>
                  <SeoPanel
                    idPrefix="news"
                    section="actualites"
                    locale={locale}
                    metaTitle={d.metaTitle}
                    metaDescription={d.metaDescription}
                    fallbackTitle={d.title}
                    fallbackDescription={d.excerpt}
                    slug={d.slug}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Diaporama</CardTitle>
          </CardHeader>
          <CardContent>
            <NewsGalleryEditor
              value={gallery}
              activeLocale={activeLocale}
              onChange={(next) => {
                setGallery(next);
                markActiveDirty();
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <PublicationPanel
          entityId={newsId}
          entityLabel="cette actualité"
          summaries={summaries}
          activeLocale={activeLocale}
          saving={draft.saving}
          publishing={publishing}
          saveLabel={draft.saveLabel}
          onSave={() => performSave(activeLocale)}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onDelete={handleDelete}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Couverture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
              {cover ? (
                <CldImage publicId={cover.publicId} alt="" fill sizes="320px" blurDataUrl={cover.blurDataUrl} />
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
                    {cover ? "Changer" : "Choisir une image"}
                  </Button>
                }
                onSelect={(assets) => {
                  setCover(assets[0] ?? null);
                  markActiveDirty();
                }}
              />
              {cover && (
                <Button type="button" variant="ghost" size="sm" onClick={() => { setCover(null); markActiveDirty(); }}>
                  Retirer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Événement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-event-date">Date de l&apos;événement</Label>
              <Input
                id="news-event-date"
                type="date"
                value={eventDate}
                onChange={(event) => { setEventDate(event.target.value); markActiveDirty(); }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="news-location">Lieu</Label>
              <Input
                id="news-location"
                value={location}
                onChange={(event) => { setLocation(event.target.value); markActiveDirty(); }}
                placeholder="Nouakchott"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vidéo externe</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <Label htmlFor="news-external-video">Lien YouTube ou Vimeo</Label>
            <Input
              id="news-external-video"
              value={externalVideoUrl}
              onChange={(event) => { setExternalVideoUrl(event.target.value); markActiveDirty(); }}
              placeholder="https://www.youtube.com/watch?v=…"
              aria-invalid={Boolean(videoUrlError)}
              aria-describedby="news-external-video-hint"
            />
            {videoUrlError && (
              <p role="alert" className="text-xs text-destructive">
                {videoUrlError}
              </p>
            )}
            <p id="news-external-video-hint" className="text-xs text-muted-foreground">
              Vidéo trop volumineuse (100 Mo) ou trop longue (120 s) pour être envoyée directement ? Utilisez un lien
              YouTube ou Vimeo ici à la place.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
