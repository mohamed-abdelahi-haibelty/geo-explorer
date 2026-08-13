"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CldImage } from "@/components/media/cld-image";

export type AuthorLite = {
  id: string;
  name: string;
  photo: { publicId: string; blurDataUrl: string | null } | null;
};

// An ordered multi-select — position is the array index,
// submitted as-is; the article actions write it straight to ArticleAuthor.position.
export function ArticleAuthorsPicker({
  value,
  onChange,
  suggestions,
}: {
  value: AuthorLite[];
  onChange: (authors: AuthorLite[]) => void;
  suggestions: AuthorLite[];
}) {
  const [open, setOpen] = useState(false);
  const available = suggestions.filter((author) => !value.some((selected) => selected.id === author.id));

  function add(author: AuthorLite) {
    onChange([...value, author]);
    setOpen(false);
  }

  function remove(id: string) {
    onChange(value.filter((author) => author.id !== id));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((author, index) => (
            <li key={author.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5 pl-2">
              <span className="relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                {author.photo ? (
                  <CldImage publicId={author.photo.publicId} alt="" fill sizes="28px" blurDataUrl={author.photo.blurDataUrl} />
                ) : (
                  author.name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="flex-1 truncate text-sm text-foreground">{author.name}</span>
              <div className="flex items-center gap-0.5">
                <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Monter ${author.name}`}>
                  <ChevronUp aria-hidden="true" className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label={`Descendre ${author.name}`}
                >
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(author.id)} aria-label={`Retirer ${author.name}`}>
                  <X aria-hidden="true" className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="w-fit">
              <Plus aria-hidden="true" />
              Ajouter un auteur
            </Button>
          }
        />
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput placeholder="Rechercher un auteur…" />
            <CommandList>
              <CommandEmpty>Aucun auteur disponible.</CommandEmpty>
              <CommandGroup>
                {available.map((author) => (
                  <CommandItem key={author.id} value={author.name} onSelect={() => add(author)}>
                    {author.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
