"use client";

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { RepeatableArrayEditor } from "@/components/admin/repeatable-array-editor";
import { updateSiteSettingAction } from "@/server/actions/settings";
import type { SiteSetting } from "@/prisma/generated/client";

type OgImage = { id: string; publicId: string; blurDataUrl: string | null };

// One flat form, no locale tabs — every SiteSetting field is
// locale-independent factual data (company name, address, contacts), unlike
// every other surface in this task. One-shot save-on-submit, not the
// autosave/dirty-tracking News and Services use: there's a single row and
// no tab state to desync, so autosave's added complexity isn't earning its
// keep here — but the conflict check and never-lose-input contract still
// apply.
export function SettingsForm({ setting, ogImage: initialOgImage }: { setting: SiteSetting | null; ogImage: OgImage | null }) {
  const [companyName, setCompanyName] = useState(setting?.companyName ?? "");
  const [tagline, setTagline] = useState(setting?.tagline ?? "");
  const [address, setAddress] = useState(setting?.address ?? "");
  const [latitude, setLatitude] = useState(setting?.latitude != null ? String(setting.latitude) : "");
  const [longitude, setLongitude] = useState(setting?.longitude != null ? String(setting.longitude) : "");
  const [phones, setPhones] = useState<string[]>(setting?.phones ?? []);
  const [email, setEmail] = useState(setting?.email ?? "");
  const [siteUrl, setSiteUrl] = useState(setting?.siteUrl ?? "");
  const [contactRecipients, setContactRecipients] = useState<string[]>(setting?.contactRecipients ?? []);
  const [mapEmbedUrl, setMapEmbedUrl] = useState(setting?.mapEmbedUrl ?? "");
  const [linkedin, setLinkedin] = useState(setting?.linkedin ?? "");
  const [facebook, setFacebook] = useState(setting?.facebook ?? "");
  const [analyticsId, setAnalyticsId] = useState(setting?.analyticsId ?? "");
  const [ogImage, setOgImage] = useState<OgImage | null>(initialOgImage);

  const [lastKnownUpdatedAt, setLastKnownUpdatedAt] = useState<string | null>(setting?.updatedAt.toISOString() ?? null);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ updatedAt: string } | null>(null);
  const [saveLabel, setSaveLabel] = useState("Toutes les modifications sont enregistrées.");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function performSave(opts: { force?: boolean } = {}) {
    setSaving(true);
    setErrorMessage(null);
    setFieldErrors({});

    const result = await updateSiteSettingAction({
      companyName: companyName.trim(),
      tagline: tagline.trim() || undefined,
      address: address.trim() || undefined,
      latitude: latitude.trim() || undefined,
      longitude: longitude.trim() || undefined,
      phones: phones.map((p) => p.trim()).filter(Boolean),
      email: email.trim() || undefined,
      siteUrl: siteUrl.trim() || undefined,
      contactRecipients: contactRecipients.map((r) => r.trim()).filter(Boolean),
      mapEmbedUrl: mapEmbedUrl.trim() || undefined,
      linkedin: linkedin.trim() || undefined,
      facebook: facebook.trim() || undefined,
      defaultOgImage: ogImage?.id,
      analyticsId: analyticsId.trim() || undefined,
      updatedAt: lastKnownUpdatedAt ?? undefined,
      force: opts.force,
    });

    setSaving(false);
    if (result.ok) {
      setLastKnownUpdatedAt(result.data.updatedAt);
      setConflict(null);
      setSaveLabel(`Enregistré à ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}.`);
    } else if (result.code === "CONFLICT") {
      setConflict({ updatedAt: result.fields?.updatedAt ?? new Date().toISOString() });
      setSaveLabel("Conflit détecté — enregistrement en pause.");
    } else {
      setErrorMessage(result.message);
      if (result.fields) setFieldErrors(result.fields);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      {conflict && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="text-foreground">Les paramètres ont été modifiés ailleurs depuis leur chargement.</span>
          <div className="flex shrink-0 gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => window.location.reload()}>
              Recharger la page
            </Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => performSave({ force: true })}>
              Enregistrer quand même
            </Button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Entreprise</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-company-name">
              Nom de l&apos;entreprise <span className="text-destructive">*</span>
            </Label>
            <Input id="settings-company-name" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
            {fieldErrors.companyName && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.companyName}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-tagline">Slogan</Label>
            <Input id="settings-tagline" value={tagline} onChange={(event) => setTagline(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-address">Adresse</Label>
            <Input id="settings-address" value={address} onChange={(event) => setAddress(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-latitude">Latitude</Label>
              <Input
                id="settings-latitude"
                type="number"
                step="any"
                placeholder="18.1097"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
              />
              {fieldErrors.latitude && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.latitude}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="settings-longitude">Longitude</Label>
              <Input
                id="settings-longitude"
                type="number"
                step="any"
                placeholder="-15.9780"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
              />
              {fieldErrors.longitude && (
                <p role="alert" className="text-sm text-destructive">
                  {fieldErrors.longitude}
                </p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Utilisées pour le repère de localisation (données structurées LocalBusiness).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Téléphones</Label>
            <RepeatableArrayEditor
              items={phones}
              itemLabel="Téléphone"
              max={6}
              createItem={() => ""}
              onChange={setPhones}
              renderItem={(item, _index, update) => <Input value={item} onChange={(event) => update(event.target.value)} />}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-email">E-mail</Label>
            <Input id="settings-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            {fieldErrors.email && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Destinataires du formulaire de contact</Label>
            <RepeatableArrayEditor
              items={contactRecipients}
              itemLabel="Destinataire"
              max={10}
              createItem={() => ""}
              onChange={setContactRecipients}
              renderItem={(item, _index, update) => <Input type="email" value={item} onChange={(event) => update(event.target.value)} />}
            />
            {fieldErrors.contactRecipients && (
              <p role="alert" className="text-sm text-destructive">
                {fieldErrors.contactRecipients}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Site et réseaux</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-site-url">URL du site</Label>
            <Input id="settings-site-url" type="url" value={siteUrl} onChange={(event) => setSiteUrl(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-map">URL de la carte (Google Maps embed)</Label>
            <Input id="settings-map" type="url" value={mapEmbedUrl} onChange={(event) => setMapEmbedUrl(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-linkedin">LinkedIn</Label>
            <Input id="settings-linkedin" type="url" value={linkedin} onChange={(event) => setLinkedin(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-facebook">Facebook</Label>
            <Input id="settings-facebook" type="url" value={facebook} onChange={(event) => setFacebook(event.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="settings-analytics">Identifiant analytics</Label>
            <Input id="settings-analytics" value={analyticsId} onChange={(event) => setAnalyticsId(event.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Image de partage par défaut (OG)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="relative aspect-[1200/630] w-full max-w-xs overflow-hidden rounded-lg bg-muted">
            {ogImage ? (
              <CldImage publicId={ogImage.publicId} alt="" fill sizes="320px" blurDataUrl={ogImage.blurDataUrl} />
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
                <Button type="button" variant="outline" size="sm">
                  {ogImage ? "Changer" : "Choisir une image"}
                </Button>
              }
              onSelect={(assets) => setOgImage(assets[0] ? { id: assets[0].id, publicId: assets[0].publicId, blurDataUrl: assets[0].blurDataUrl } : null)}
            />
            {ogImage && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setOgImage(null)}>
                Retirer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {saveLabel}
        </p>
        <Button type="button" onClick={() => performSave()} disabled={saving || conflict !== null}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
