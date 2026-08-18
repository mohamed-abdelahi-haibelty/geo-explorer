"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Pencil, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { createAuthor, updateAuthor } from "@/server/actions/authors";
import { slugify } from "@/lib/slug";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { Author, MediaAsset } from "@/prisma/generated/client";

type AuthorWithPhoto = Author & { photo: MediaAsset | null };

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

// Only fr is required to have content — see lib/validation/locale.ts's
// localizedTextSchema. Reading `undefined`/non-string values as "" keeps
// the tab inputs uncontrolled-safe regardless of whether the author has
// ever had an EN/AR value written.
function localeText(value: unknown, locale: LocaleCode): string {
  const text = value as Partial<Record<LocaleCode, string>> | null;
  return typeof text?.[locale] === "string" ? text[locale] : "";
}

export function AuthorFormDialog({ author }: { author?: AuthorWithPhoto }) {
  const router = useRouter();
  const isEdit = Boolean(author);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(author?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [photo, setPhoto] = useState<MediaAsset | null>(author?.photo ?? null);
  const action = isEdit ? updateAuthor : createAuthor;
  const [state, formAction, pending] = useActionState(action, null);

  // Adjusting state during render (React's documented alternative to a
  // setState-in-effect) closes the dialog the same render the result lands;
  // router.refresh() is a real side effect, so it stays in its own effect.
  const [handledState, setHandledState] = useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state?.ok) setOpen(false);
  }

  useEffect(() => {
    if (state?.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setSlug(author?.slug ?? "");
      setSlugTouched(isEdit);
      setPhoto(author?.photo ?? null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Modifier ${author!.name}`} title="Modifier" />
          ) : (
            <Button type="button">
              <Plus aria-hidden="true" />
              Nouvel auteur
            </Button>
          )
        }
      >
        {isEdit && <Pencil aria-hidden="true" className="size-3.5" />}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier l'auteur" : "Nouvel auteur"}</DialogTitle>
          <DialogDescription>
            Nom, fonction, biographie et coordonnées affichés sur les articles et la page auteur.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={author!.id} />}
          <input type="hidden" name="photoId" value={photo?.id ?? ""} />

          <div className="flex items-center gap-3">
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground ring-1 ring-border">
              {photo ? (
                <CldImage publicId={photo.publicId} alt="" fill sizes="64px" blurDataUrl={photo.blurDataUrl} />
              ) : (
                <ImagePlus aria-hidden="true" className="size-5" />
              )}
            </span>
            <MediaPicker
              accept={["IMAGE"]}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  {photo ? "Changer la photo" : "Choisir une photo"}
                </Button>
              }
              onSelect={(assets) => setPhoto(assets[0] ?? null)}
            />
            {photo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>
                Retirer
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author-name"
              name="name"
              required
              defaultValue={author?.name}
              onChange={(event) => {
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              aria-invalid={state && !state.ok && !!state.fields?.name ? true : undefined}
            />
            {state && !state.ok && state.fields?.name && (
              <p role="alert" className="text-sm text-destructive">
                {state.fields.name}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="author-slug">Slug</Label>
            <Input
              id="author-slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="font-mono text-sm"
              aria-describedby="author-slug-hint"
            />
            <p id="author-slug-hint" className="text-xs text-muted-foreground">
              Utilisé dans l&apos;URL de la page auteur — généré depuis le nom, modifiable.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Fonction et biographie</Label>
            <Tabs defaultValue="fr">
              <TabsList>
                {LOCALES.map((locale) => (
                  <TabsTrigger key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LOCALES.map((locale) => (
                // keepMounted: Base UI unmounts an inactive panel by default,
                // which took these uncontrolled inputs' typed values with it —
                // switching FR→EN lost the FR text, and submitting from the EN
                // tab sent no `*_fr` field at all, so localizedFromFormData()
                // read fr as empty and wrote the whole title/bio back as unset,
                // wiping every locale at once.
                <TabsContent keepMounted key={locale} value={locale} className="flex flex-col gap-3 pt-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`author-title-${locale}`}>Fonction</Label>
                    <Input
                      id={`author-title-${locale}`}
                      name={`title_${locale}`}
                      placeholder={locale === "fr" ? "Géologue senior" : undefined}
                      defaultValue={localeText(author?.title, locale)}
                      dir={locale === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`author-bio-${locale}`}>Biographie</Label>
                    <Textarea
                      id={`author-bio-${locale}`}
                      name={`bio_${locale}`}
                      rows={4}
                      defaultValue={localeText(author?.bio, locale)}
                      dir={locale === "ar" ? "rtl" : "ltr"}
                    />
                  </div>
                </TabsContent>
              ))}
            </Tabs>
            <p className="text-xs text-muted-foreground">
              Le français est requis si la fonction ou la biographie est renseignée ; anglais et arabe sont
              optionnels.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author-email">E-mail</Label>
              <Input
                id="author-email"
                name="email"
                type="email"
                defaultValue={author?.email ?? ""}
                aria-invalid={state && !state.ok && !!state.fields?.email ? true : undefined}
              />
              {state && !state.ok && state.fields?.email && (
                <p role="alert" className="text-sm text-destructive">
                  {state.fields.email}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="author-linkedin">LinkedIn</Label>
              <Input
                id="author-linkedin"
                name="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/…"
                defaultValue={author?.linkedin ?? ""}
                aria-invalid={state && !state.ok && !!state.fields?.linkedin ? true : undefined}
              />
              {state && !state.ok && state.fields?.linkedin && (
                <p role="alert" className="text-sm text-destructive">
                  {state.fields.linkedin}
                </p>
              )}
            </div>
          </div>

          {state && !state.ok && !state.fields && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer l'auteur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
