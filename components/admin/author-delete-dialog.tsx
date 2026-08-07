"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAuthor, getAuthorArticleCountAction } from "@/server/actions/authors";

export function AuthorDeleteDialog({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    if (next) {
      setCount(null);
      startTransition(async () => {
        const result = await getAuthorArticleCountAction(id);
        setCount(result.ok ? result.data : 0);
      });
    }
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteAuthor(id);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const blocked = (count ?? 0) > 0;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer ${name}`} title="Supprimer" />}
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {name} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            {count === null
              ? "Vérification des articles associés…"
              : blocked
                ? `Impossible de supprimer : ${count} article${count > 1 ? "s" : ""} référence${count > 1 ? "nt" : ""} encore cet auteur. Retirez-le de ces articles avant de continuer.`
                : "Cet auteur n'est associé à aucun article. Cette action est définitive."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{blocked ? "Fermer" : "Annuler"}</AlertDialogCancel>
          {!blocked && (
            <AlertDialogAction variant="destructive" disabled={pending || count === null} onClick={handleConfirm}>
              {pending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
