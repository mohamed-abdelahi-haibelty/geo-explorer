"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { deleteTagAction, getTagArticleCountAction } from "@/server/actions/tags";

type TagSuggestion = { id: string; name: string };

// "Select existing or create by name" (Task 04 step 4) — the picker only ever
// deals in names. server/actions/articles.ts upserts each name by Tag.name,
// so a "new" tag and an existing one take the same code path at save time.
// Deletion (Task 04a follow-up) lives here too, inline in the suggestion
// list, rather than a dedicated /admin/tags route — tags stay a
// browse-and-manage-inline entity by design.
export function TagPicker({
  value,
  onChange,
  suggestions,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions: TagSuggestion[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const [pendingDelete, setPendingDelete] = useState<TagSuggestion | null>(null);
  const [deleteCount, setDeleteCount] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim();
  const available = localSuggestions.filter((tag) => !value.includes(tag.name));
  const exactMatch = available.some((tag) => tag.name.toLowerCase() === normalizedQuery.toLowerCase());

  function addTag(name: string) {
    const trimmed = name.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setQuery("");
    setOpen(false);
  }

  function removeTag(name: string) {
    onChange(value.filter((tag) => tag !== name));
  }

  function requestDelete(tag: TagSuggestion) {
    setOpen(false);
    setPendingDelete(tag);
    setDeleteError(null);
    setDeleteCount(null);
    startTransition(async () => {
      const result = await getTagArticleCountAction(tag.id);
      setDeleteCount(result.ok ? result.data : 0);
    });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const tag = pendingDelete;
    startTransition(async () => {
      const result = await deleteTagAction(tag.id);
      if (result.ok) {
        setLocalSuggestions((prev) => prev.filter((t) => t.id !== tag.id));
        if (value.includes(tag.name)) removeTag(tag.name);
        setPendingDelete(null);
        router.refresh();
      } else {
        setDeleteError(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((name) => (
            <li key={name}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {name}
                <button
                  type="button"
                  onClick={() => removeTag(name)}
                  aria-label={`Retirer le tag ${name}`}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button type="button" variant="outline" size="sm" className="w-fit">
              <Plus aria-hidden="true" />
              Ajouter un tag
            </Button>
          }
        />
        <PopoverContent className="w-64 p-0">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Rechercher ou créer…"
              onKeyDown={(event) => {
                if (event.key === "Enter" && normalizedQuery && !exactMatch) {
                  event.preventDefault();
                  addTag(normalizedQuery);
                }
              }}
            />
            <CommandList>
              <CommandEmpty>Aucun tag existant.</CommandEmpty>
              <CommandGroup>
                {available
                  .filter((tag) => tag.name.toLowerCase().includes(normalizedQuery.toLowerCase()))
                  .map((tag) => (
                    <CommandItem key={tag.id} value={tag.name} onSelect={() => addTag(tag.name)} className="justify-between">
                      <span className="truncate">{tag.name}</span>
                      <button
                        type="button"
                        aria-label={`Supprimer le tag ${tag.name}`}
                        title="Supprimer ce tag"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                          event.stopPropagation();
                          requestDelete(tag);
                        }}
                        className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                      </button>
                    </CommandItem>
                  ))}
                {normalizedQuery && !exactMatch && (
                  <CommandItem value={`create:${normalizedQuery}`} onSelect={() => addTag(normalizedQuery)}>
                    <Plus aria-hidden="true" className="size-3.5" />
                    Créer « {normalizedQuery} »
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(next) => !next && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tag « {pendingDelete?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCount === null
                ? "Vérification des articles associés…"
                : deleteCount > 0
                  ? `Ce tag est utilisé sur ${deleteCount} article${deleteCount > 1 ? "s" : ""}. Il sera retiré de ${deleteCount > 1 ? "chacun d'eux" : "cet article"}. Cette action est définitive.`
                  : "Ce tag n'est associé à aucun article. Cette action est définitive."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending || deleteCount === null} onClick={confirmDelete}>
              {pending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
