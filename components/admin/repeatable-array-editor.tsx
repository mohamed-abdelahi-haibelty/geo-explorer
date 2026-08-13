"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Generalizes NewsGalleryEditor's drag+chevron reorder to any
// array of values — value arrays (bullets, project types) and object arrays
// (values, strengths, approach steps) alike. Position is array index at
// save time, same rule the gallery follows; items have no natural id, so
// the array index doubles as both the reorder target and the React key —
// safe here because every field is fully controlled by its array slot.
export function RepeatableArrayEditor<T>({
  items,
  onChange,
  renderItem,
  createItem,
  itemLabel,
  max,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, index: number, update: (next: T) => void) => ReactNode;
  createItem: () => T;
  itemLabel: string;
  max?: number;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function update(index: number, next: T) {
    onChange(items.map((item, i) => (i === index ? next : item)));
  }

  return (
    <div className="flex flex-col gap-2">
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li
              key={index}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setOverIndex(index);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (dragIndex !== null) reorder(dragIndex, index);
                setDragIndex(null);
                setOverIndex(null);
              }}
              className={`flex gap-2 rounded-lg border bg-card p-2 transition-colors ${
                overIndex === index && dragIndex !== null && dragIndex !== index ? "border-secondary" : "border-border"
              }`}
            >
              <span className="flex shrink-0 cursor-grab items-center text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                <GripVertical className="size-4" />
              </span>
              <div className="min-w-0 flex-1">{renderItem(item, index, (next) => update(index, next))}</div>
              <div className="flex shrink-0 flex-col items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">
                  <ChevronUp aria-hidden="true" className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Descendre"
                >
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)} aria-label={`Retirer : ${itemLabel}`}>
                  <X aria-hidden="true" className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {(max === undefined || items.length < max) && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...items, createItem()])}>
          <Plus aria-hidden="true" />
          Ajouter : {itemLabel.toLowerCase()}
        </Button>
      )}
    </div>
  );
}
