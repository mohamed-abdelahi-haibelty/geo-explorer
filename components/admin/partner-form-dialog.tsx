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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { createPartner, updatePartner } from "@/server/actions/partners";
import { slugify } from "@/lib/slug";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { Partner, MediaAsset } from "@/prisma/generated/client";

type PartnerWithLogo = Partner & { logo: MediaAsset | null };

const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "Français", en: "English", ar: "العربية" };

function localeText(value: unknown, locale: LocaleCode): string {
  const text = value as Partial<Record<LocaleCode, string>> | null;
  return typeof text?.[locale] === "string" ? text[locale] : "";
}

export function PartnerFormDialog({ partner }: { partner?: PartnerWithLogo }) {
  const router = useRouter();
  const isEdit = Boolean(partner);
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(partner?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [logo, setLogo] = useState<MediaAsset | null>(partner?.logo ?? null);
  const [published, setPublished] = useState(partner?.published ?? true);
  const action = isEdit ? updatePartner : createPartner;
  const [state, formAction, pending] = useActionState(action, null);

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
      setSlug(partner?.slug ?? "");
      setSlugTouched(isEdit);
      setLogo(partner?.logo ?? null);
      setPublished(partner?.published ?? true);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Modifier ${partner!.name}`} title="Modifier" />
          ) : (
            <Button type="button">
              <Plus aria-hidden="true" />
              Nouveau partenaire
            </Button>
          )
        }
      >
        {isEdit && <Pencil aria-hidden="true" className="size-3.5" />}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier le partenaire" : "Nouveau partenaire"}</DialogTitle>
          <DialogDescription>Nom, logo, site web et catégorie affichés dans la section partenaires.</DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" name="id" value={partner!.id} />}
          <input type="hidden" name="logoId" value={logo?.id ?? ""} />
          <input type="hidden" name="published" value={String(published)} />

          <div className="flex items-center gap-3">
            <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
              {logo ? (
                <CldImage publicId={logo.publicId} alt="" fill sizes="64px" blurDataUrl={logo.blurDataUrl} />
              ) : (
                <ImagePlus aria-hidden="true" className="size-5" />
              )}
            </span>
            <MediaPicker
              accept={["IMAGE"]}
              trigger={
                <Button type="button" variant="outline" size="sm">
                  {logo ? "Changer le logo" : "Choisir un logo"}
                </Button>
              }
              onSelect={(assets) => setLogo(assets[0] ?? null)}
            />
            {logo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogo(null)}>
                Retirer
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partner-name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="partner-name"
              name="name"
              required
              defaultValue={partner?.name}
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
            <Label htmlFor="partner-slug">Slug</Label>
            <Input
              id="partner-slug"
              name="slug"
              value={slug}
              onChange={(event) => {
                setSlugTouched(true);
                setSlug(event.target.value);
              }}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="partner-website">Site web</Label>
            <Input
              id="partner-website"
              name="websiteUrl"
              type="url"
              placeholder="https://…"
              defaultValue={partner?.websiteUrl ?? ""}
              aria-invalid={state && !state.ok && !!state.fields?.websiteUrl ? true : undefined}
            />
            {state && !state.ok && state.fields?.websiteUrl && (
              <p role="alert" className="text-sm text-destructive">
                {state.fields.websiteUrl}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Catégorie</Label>
            <Tabs defaultValue="fr">
              <TabsList>
                {LOCALES.map((locale) => (
                  <TabsTrigger key={locale} value={locale}>
                    {LOCALE_LABELS[locale]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {LOCALES.map((locale) => (
                <TabsContent key={locale} value={locale} className="pt-2">
                  <Input
                    id={`partner-category-${locale}`}
                    name={`category_${locale}`}
                    placeholder={locale === "fr" ? "Public, Privé…" : undefined}
                    defaultValue={localeText(partner?.category, locale)}
                    dir={locale === "ar" ? "rtl" : "ltr"}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
            <Label htmlFor="partner-published" className="flex flex-col gap-0.5">
              <span>Publié</span>
              <span className="text-xs font-normal text-muted-foreground">Visible sur le site public</span>
            </Label>
            <Switch id="partner-published" checked={published} onCheckedChange={setPublished} />
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
              {pending ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le partenaire"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
