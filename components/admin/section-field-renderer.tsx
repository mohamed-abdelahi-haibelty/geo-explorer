"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MediaPicker } from "@/components/admin/media-picker";
import { CldImage } from "@/components/media/cld-image";
import { RepeatableArrayEditor } from "@/components/admin/repeatable-array-editor";
import type { FieldSpec } from "@/lib/validation/sections";
import type { LocaleCode } from "@/lib/validation/locale";

type ImageLite = { id: string; publicId: string; blurDataUrl: string | null };

// Renders a PageSection's (or a Service block's) fields from a declarative
// FieldSpec[] — the Zod schema in lib/validation/sections.ts
// stays the validation source of truth, this only drives layout. Recurses
// into itself for `array-of-objects` item fields.
export function SectionFieldRenderer({
  idPrefix,
  fields,
  data,
  onChange,
  locale,
  images,
}: {
  idPrefix: string;
  fields: FieldSpec[];
  data: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  locale: LocaleCode;
  images: Record<string, ImageLite>;
}) {
  const dir = locale === "ar" ? "rtl" : "ltr";

  function setField(key: string, value: unknown) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="flex flex-col gap-4">
      {fields.map((field) => {
        const fieldId = `${idPrefix}-${field.key}`;

        if (field.kind === "text") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId}>{field.label}</Label>
              <Input
                id={fieldId}
                value={(data[field.key] as string) ?? ""}
                maxLength={field.max}
                dir={dir}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            </div>
          );
        }

        if (field.kind === "textarea") {
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={fieldId}>{field.label}</Label>
              <Textarea
                id={fieldId}
                rows={4}
                value={(data[field.key] as string) ?? ""}
                maxLength={field.max}
                dir={dir}
                onChange={(event) => setField(field.key, event.target.value)}
              />
            </div>
          );
        }

        if (field.kind === "image") {
          const imageId = data[field.key] as string | undefined;
          const asset = imageId ? images[imageId] : undefined;
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.label} (facultative)</Label>
              <div className="flex items-center gap-3">
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {asset && <CldImage publicId={asset.publicId} alt="" fill sizes="128px" blurDataUrl={asset.blurDataUrl} />}
                </div>
                <div className="flex gap-2">
                  <MediaPicker
                    accept={["IMAGE"]}
                    trigger={
                      <Button type="button" variant="outline" size="sm">
                        {imageId ? "Changer" : "Choisir une image"}
                      </Button>
                    }
                    onSelect={(assets) => setField(field.key, assets[0]?.id)}
                  />
                  {imageId && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setField(field.key, undefined)}>
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }

        if (field.kind === "array-of-strings") {
          const items = (data[field.key] as string[] | undefined) ?? [];
          return (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label>{field.label}</Label>
              <RepeatableArrayEditor
                items={items}
                itemLabel={field.itemLabel}
                max={field.max}
                createItem={() => ""}
                onChange={(next) => setField(field.key, next)}
                renderItem={(item, _index, update) => (
                  <Input value={item} dir={dir} placeholder={field.itemLabel} onChange={(event) => update(event.target.value)} />
                )}
              />
            </div>
          );
        }

        // array-of-objects
        const items = (data[field.key] as Record<string, unknown>[] | undefined) ?? [];
        return (
          <div key={field.key} className="flex flex-col gap-1.5">
            <Label>{field.label}</Label>
            <RepeatableArrayEditor
              items={items}
              itemLabel={field.itemLabel}
              max={field.max}
              createItem={() => ({})}
              onChange={(next) => setField(field.key, next)}
              renderItem={(item, index, update) => (
                <SectionFieldRenderer
                  idPrefix={`${fieldId}-${index}`}
                  fields={field.itemFields}
                  data={item}
                  onChange={update}
                  locale={locale}
                  images={images}
                />
              )}
            />
          </div>
        );
      })}
    </div>
  );
}
