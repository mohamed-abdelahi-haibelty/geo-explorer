"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
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
import { deleteMediaAssetsAction, getMediaUsageBatchAction } from "@/server/actions/media";
import { MEDIA_USAGE_KIND_LABEL } from "@/lib/media-client";
import type { MediaUsageItem } from "@/server/queries/media";

export function MediaBulkBar({
  selectedIds,
  onCleared,
}: {
  selectedIds: string[];
  onCleared: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<MediaUsageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (selectedIds.length === 0) return null;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    if (next) {
      setUsage(null);
      startTransition(async () => {
        const result = await getMediaUsageBatchAction(selectedIds);
        setUsage(result.ok ? result.data : []);
      });
    }
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteMediaAssetsAction(selectedIds);
      if (result.ok) {
        setOpen(false);
        onCleared();
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  const count = selectedIds.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
      <p className="text-sm font-medium text-foreground">
        {count} média{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={onCleared}>
          <X aria-hidden="true" />
          Tout désélectionner
        </Button>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger render={<Button type="button" variant="destructive" size="sm" />}>
            <Trash2 aria-hidden="true" />
            Supprimer ({count})
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Supprimer {count} média{count > 1 ? "s" : ""} ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {usage === null
                  ? "Vérification de l'utilisation…"
                  : usage.length === 0
                    ? "Aucun de ces médias n'est utilisé ailleurs sur le site."
                    : `${usage.length} référence${usage.length > 1 ? "s" : ""} seront retirées :`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {usage !== null && usage.length > 0 && (
              <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg bg-muted p-2 text-xs">
                {usage.slice(0, 8).map((item, index) => (
                  <li key={index} className="truncate">
                    <span className="font-mono text-muted-foreground">{MEDIA_USAGE_KIND_LABEL[item.kind]} — </span>
                    {item.label}
                  </li>
                ))}
                {usage.length > 8 && (
                  <li className="text-muted-foreground">+ {usage.length - 8} autre(s)</li>
                )}
              </ul>
            )}
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive" disabled={pending || usage === null} onClick={handleConfirm}>
                {pending ? "Suppression…" : `Supprimer ${count > 1 ? "les médias" : "le média"}`}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
