"use client";

import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RepeatableArrayEditor } from "@/components/admin/repeatable-array-editor";
import { useDragReorder } from "@/lib/hooks/use-drag-reorder";
import type { LocaleCode } from "@/lib/validation/locale";

// `id: null` marks a block not yet persisted — `key` stays stable (a real id
// or a client-generated one) across the whole editing session either way, so
// drag-and-drop identity survives a save (a deliberate deviation
// from the seed's delete-and-recreate — see server/actions/services.ts).
export type ServiceBlockDraft = {
  key: string;
  id: string | null;
  title: Partial<Record<LocaleCode, string>>;
  items: Partial<Record<LocaleCode, string[]>>;
};

// Block position is shared across locales — there is exactly one
// ServiceBlock row per block, so the list itself (which blocks, what order)
// never varies by tab. Title and bullets inside each card are per-locale:
// switching tabs reads/writes a different key of the same block object.
// Bullets reorder independently per locale (no id to couple them by — the
// arrays are deliberately not coupled positionally).
export function ServiceBlocksEditor({
  blocks,
  activeLocale,
  onChange,
}: {
  blocks: ServiceBlockDraft[];
  activeLocale: LocaleCode;
  onChange: (blocks: ServiceBlockDraft[]) => void;
}) {
  const { move, dragHandlers, isDropTarget } = useDragReorder(blocks, onChange);
  const dir = activeLocale === "ar" ? "rtl" : "ltr";

  function updateBlock(index: number, patch: Partial<ServiceBlockDraft>) {
    onChange(blocks.map((block, i) => (i === index ? { ...block, ...patch } : block)));
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      {blocks.length > 0 && (
        <ul className="flex flex-col gap-3">
          {blocks.map((block, index) => (
            <li
              key={block.key}
              {...dragHandlers(index)}
              className={`flex flex-col gap-3 rounded-lg border bg-card p-3 transition-colors ${
                isDropTarget(index) ? "border-secondary" : "border-border"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-6 flex shrink-0 cursor-grab items-center text-muted-foreground active:cursor-grabbing"
                  aria-hidden="true"
                >
                  <GripVertical className="size-4" />
                </span>
                <div className="flex flex-1 flex-col gap-1.5">
                  <Label htmlFor={`block-title-${block.key}`}>Titre du bloc</Label>
                  <Input
                    id={`block-title-${block.key}`}
                    value={block.title[activeLocale] ?? ""}
                    dir={dir}
                    onChange={(event) => updateBlock(index, { title: { ...block.title, [activeLocale]: event.target.value } })}
                  />
                </div>
                <div className="mt-6 flex shrink-0 flex-col items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter le bloc">
                    <ChevronUp aria-hidden="true" className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === blocks.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Descendre le bloc"
                  >
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeBlock(index)} aria-label="Retirer ce bloc">
                    <X aria-hidden="true" className="size-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pl-6">
                <Label className="text-xs text-muted-foreground">Puces ({activeLocale.toUpperCase()})</Label>
                <RepeatableArrayEditor
                  items={block.items[activeLocale] ?? []}
                  itemLabel="Puce"
                  createItem={() => ""}
                  onChange={(next) => updateBlock(index, { items: { ...block.items, [activeLocale]: next } })}
                  renderItem={(item, _index, update) => (
                    <Input value={item} dir={dir} onChange={(event) => update(event.target.value)} />
                  )}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() => onChange([...blocks, { key: crypto.randomUUID(), id: null, title: {}, items: {} }])}
      >
        <Plus aria-hidden="true" />
        Ajouter un bloc
      </Button>
    </div>
  );
}
