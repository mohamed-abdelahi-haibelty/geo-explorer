"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ImagePlus, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { TagPicker } from "@/components/admin/tag-picker";
import { ArticleAuthorsPicker, type AuthorLite } from "@/components/admin/article-authors-picker";
import { ArticleSeoPanel } from "@/components/admin/article-seo-panel";
import { ArticlePublicationPanel, type LocalePublicationSummary } from "@/components/admin/article-publication-panel";
import ArticleEditor from "@/components/editor/article-editor-dynamic";
import type { ArticleEditorHandle } from "@/components/editor/article-editor";
import {
  createArticleAction,
  createArticlePreviewLinkAction,
  createArticleTranslationAction,
  deleteArticleAction,
  getArticleForEditAction,
  publishArticleAction,
  unpublishArticleAction,
  updateArticleAction,
} from "@/server/actions/articles";
import { slugify } from "@/lib/slug";
import { formatBytes } from "@/lib/media-client";
import { pickLocalizedText } from "@/lib/locale";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { JSONContent } from "@tiptap/core";
import type { MediaAsset, PublishStatus } from "@/prisma/generated/client";
import type { getArticleForEdit } from "@/server/queries/articles";

type ArticleForEdit = NonNullable<Awaited<ReturnType<typeof getArticleForEdit>>>;
type Translation = ArticleForEdit["translations"][number];

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

function toAuthorLite(row: ArticleForEdit["authors"][number]): AuthorLite {
  return {
    id: row.author.id,
    name: row.author.name,
    photo: row.author.photo ? { publicId: row.author.photo.publicId, blurDataUrl: row.author.photo.blurDataUrl } : null,
  };
}

type TranslationDraft = {
  translationId: string | null;
  title: string;
  subtitle: string;
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

function emptyDraft(): TranslationDraft {
  return {
    translationId: null,
    title: "",
    subtitle: "",
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
    subtitle: t.subtitle ?? "",
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

function draftsFromArticle(article: ArticleForEdit | null): Record<LocaleCode, TranslationDraft> {
  const result = {} as Record<LocaleCode, TranslationDraft>;
  for (const locale of LOCALES) {
    const dbLocale = locale.toUpperCase();
    const translation = article?.translations.find((t) => t.locale === dbLocale);
    result[locale] = translation ? draftFromTranslation(translation) : emptyDraft();
  }
  return result;
}

export function ArticleForm({
  article,
  authorSuggestions,
  tagSuggestions,
}: {
  article: ArticleForEdit | null;
  authorSuggestions: AuthorLite[];
  tagSuggestions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const editorRefFr = useRef<ArticleEditorHandle>(null);
  const editorRefEn = useRef<ArticleEditorHandle>(null);
  const editorRefAr = useRef<ArticleEditorHandle>(null);
  const editorRefs: Record<LocaleCode, React.RefObject<ArticleEditorHandle | null>> = {
    fr: editorRefFr,
    en: editorRefEn,
    ar: editorRefAr,
  };

  const [articleId, setArticleId] = useState(article?.id ?? null);
  const [drafts, setDrafts] = useState<Record<LocaleCode, TranslationDraft>>(() => draftsFromArticle(article));
  const [activeLocale, setActiveLocale] = useState<LocaleCode>("fr");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Locale-independent — cover, PDF, authors, tags, featured — edited once
  // regardless of which locale tab is active (Task 04a step 10).
  const [cover, setCover] = useState<MediaAsset | null>(article?.cover ?? null);
  const [pdf, setPdf] = useState<{ url: string; bytes: number } | null>(
    article?.pdfUrl ? { url: article.pdfUrl, bytes: article.pdfBytes ?? 0 } : null,
  );
  const [authors, setAuthors] = useState<AuthorLite[]>(article?.authors.map(toAuthorLite) ?? []);
  const [tagNames, setTagNames] = useState<string[]>(
    article?.tags.map((row) => pickLocalizedText(row.tag.name, "fr")) ?? [],
  );
  const [featured, setFeatured] = useState(article?.featured ?? false);

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

    const payload = {
      locale,
      title: current.title.trim(),
      subtitle: current.subtitle.trim() || undefined,
      slug: current.slug.trim() || undefined,
      excerpt: current.excerpt.trim() || undefined,
      contentJson: editorRefs[locale].current?.getJSON() ?? ({ type: "doc", content: [] } as JSONContent),
      metaTitle: current.metaTitle.trim() || undefined,
      metaDescription: current.metaDescription.trim() || undefined,
      coverId: cover?.id,
      pdfUrl: pdf?.url,
      pdfBytes: pdf?.bytes,
      featured,
      authorIds: authors.map((a) => a.id),
      tagNames,
    };

    const result = current.translationId
      ? await updateArticleAction({
          translationId: current.translationId,
          updatedAt: current.lastKnownUpdatedAt!,
          force: opts.force,
          ...payload,
        })
      : articleId
        ? await createArticleTranslationAction({ articleId, ...payload })
        : await createArticleAction(payload);

    if (result.ok) {
      if (!articleId) setArticleId(result.data.articleId);
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
      setDrafts((prev) => ({ ...prev, [locale]: nextDraft }));
      if (!article && !articleId) {
        router.replace(`/admin/articles/${result.data.articleId}`);
      }
      return nextDraft;
    }

    updateDraft(locale, { saving: false });
    if (result.code === "CONFLICT") {
      updateDraft(locale, {
        conflict: { updatedAt: result.fields?.updatedAt ?? new Date().toISOString() },
        saveLabel: "Conflit détecté — l'enregistrement automatique est en pause.",
      });
    } else {
      setErrorMessage(result.message);
      if (result.fields?.slug) updateDraft(locale, { saveLabel: "Le slug est verrouillé après la première publication." });
    }
    return null;
  }

  // Three independent 30s-debounce autosave timers, one per locale — a dirty
  // EN tab keeps counting down even while the admin is looking at FR
  // (Task 04a step 10). Unrolled per-locale rather than a loop: the set of
  // locales is fixed, so three static hook call sites are exactly as valid
  // as one, and each effect's dependency array stays precise.
  useEffect(() => {
    if (!drafts.fr.dirty || drafts.fr.conflict) return;
    const timeout = setTimeout(() => performSave("fr"), 30000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts.fr.dirty, drafts.fr.conflict]);
  useEffect(() => {
    if (!drafts.en.dirty || drafts.en.conflict) return;
    const timeout = setTimeout(() => performSave("en"), 30000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts.en.dirty, drafts.en.conflict]);
  useEffect(() => {
    if (!drafts.ar.dirty || drafts.ar.conflict) return;
    const timeout = setTimeout(() => performSave("ar"), 30000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts.ar.dirty, drafts.ar.conflict]);

  async function handleReloadNewer(locale: LocaleCode) {
    if (!articleId) return;
    const result = await getArticleForEditAction(articleId);
    if (!result.ok || !result.data) {
      setErrorMessage(result.ok ? "Article introuvable." : result.message);
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
    setPdf(fresh.pdfUrl ? { url: fresh.pdfUrl, bytes: fresh.pdfBytes ?? 0 } : null);
    setAuthors(fresh.authors.map(toAuthorLite));
    setTagNames(fresh.tags.map((row) => pickLocalizedText(row.tag.name, "fr")));
    setFeatured(fresh.featured);
  }

  async function handlePublish() {
    const saved = await performSave(activeLocale);
    if (!saved?.translationId) return;
    setPublishing(true);
    const result = await publishArticleAction(saved.translationId);
    setPublishing(false);
    if (result.ok) updateDraft(activeLocale, { status: "PUBLISHED", publishedAt: new Date() });
    else setErrorMessage(result.message);
  }

  async function handleUnpublish() {
    const translationId = drafts[activeLocale].translationId;
    if (!translationId) return;
    setPublishing(true);
    const result = await unpublishArticleAction(translationId);
    setPublishing(false);
    if (result.ok) updateDraft(activeLocale, { status: "DRAFT" });
    else setErrorMessage(result.message);
  }

  async function handlePreview() {
    const saved = await performSave(activeLocale);
    const translationId = saved?.translationId ?? drafts[activeLocale].translationId;
    if (!translationId) return;
    const result = await createArticlePreviewLinkAction(translationId);
    if (result.ok) window.open(result.data.url, "_blank", "noopener,noreferrer");
    else setErrorMessage(result.message);
  }

  async function handleDelete() {
    if (!articleId) return;
    const result = await deleteArticleAction(articleId);
    if (result.ok) router.push("/admin/articles");
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
                    Cette traduction a été modifiée ailleurs depuis son chargement. L&apos;enregistrement
                    automatique est en pause.
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
                <Label htmlFor={`article-title-${locale}`}>
                  Titre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id={`article-title-${locale}`}
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
                  placeholder="Titre de l'article"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`article-subtitle-${locale}`}>Sous-titre</Label>
                <Input
                  id={`article-subtitle-${locale}`}
                  value={d.subtitle}
                  onChange={(event) => updateDraft(locale, { subtitle: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`article-slug-${locale}`}>Slug</Label>
                  {Boolean(d.publishedAt) && <Lock aria-hidden="true" className="size-3 text-muted-foreground" />}
                </div>
                <Input
                  id={`article-slug-${locale}`}
                  value={d.slug}
                  disabled={Boolean(d.publishedAt)}
                  onChange={(event) =>
                    updateDraft(locale, { slug: event.target.value, slugTouched: true, dirty: true, saveLabel: "Modifications non enregistrées." })
                  }
                  className="font-mono text-sm"
                  aria-describedby={`article-slug-hint-${locale}`}
                />
                <p id={`article-slug-hint-${locale}`} className="text-xs text-muted-foreground">
                  {d.publishedAt
                    ? "Verrouillé — cette traduction a déjà été publiée."
                    : "Généré depuis le titre, modifiable jusqu'à la première publication."}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`article-excerpt-${locale}`}>Extrait</Label>
                <Textarea
                  id={`article-excerpt-${locale}`}
                  rows={3}
                  value={d.excerpt}
                  onChange={(event) => updateDraft(locale, { excerpt: event.target.value, dirty: true, saveLabel: "Modifications non enregistrées." })}
                  dir={locale === "ar" ? "rtl" : "ltr"}
                  placeholder="Généré automatiquement depuis le corps de l'article si laissé vide"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Corps de l&apos;article</Label>
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
                  <ArticleSeoPanel
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

        <div className="flex flex-col gap-1.5">
          <Label>Tags</Label>
          <TagPicker value={tagNames} onChange={(next) => { setTagNames(next); markActiveDirty(); }} suggestions={tagSuggestions} />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ArticlePublicationPanel
          articleId={articleId}
          summaries={summaries}
          activeLocale={activeLocale}
          featured={featured}
          onFeaturedChange={(value) => { setFeatured(value); markActiveDirty(); }}
          saving={draft.saving}
          publishing={publishing}
          saveLabel={draft.saveLabel}
          onSave={() => performSave(activeLocale)}
          onPreview={handlePreview}
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
            <CardTitle className="text-sm">Étude (PDF)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pdf ? (
              <div className="flex items-center gap-2 rounded-lg border border-border p-2">
                <FileText aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-xs text-muted-foreground">{formatBytes(pdf.bytes)}</span>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => { setPdf(null); markActiveDirty(); }} aria-label="Retirer le PDF">
                  <X aria-hidden="true" className="size-3.5" />
                </Button>
              </div>
            ) : (
              <MediaPicker
                accept={["RAW"]}
                trigger={
                  <Button type="button" variant="outline" size="sm">
                    Joindre un PDF
                  </Button>
                }
                onSelect={(assets) => {
                  const asset = assets[0];
                  if (asset) setPdf({ url: asset.url, bytes: asset.bytes });
                  markActiveDirty();
                }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Auteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleAuthorsPicker
              value={authors}
              onChange={(next) => { setAuthors(next); markActiveDirty(); }}
              suggestions={authorSuggestions}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
