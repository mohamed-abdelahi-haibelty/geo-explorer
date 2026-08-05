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
import { deleteMediaAsset, getMediaUsageAction } from "@/server/actions/media";
import { MEDIA_USAGE_KIND_LABEL } from "@/lib/media-client";
import type { MediaUsageItem } from "@/server/queries/media";

export function MediaDeleteDialog({ id, filename }: { id: string; filename: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [usage, setUsage] = useState<MediaUsageItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    setError(null);
    if (next) {
      setUsage(null);
      startTransition(async () => {
        const result = await getMediaUsageAction(id);
        setUsage(result.ok ? result.data : []);
      });
    }
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await deleteMediaAsset(id);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Supprimer ${filename}`} title={`Supprimer ${filename}`} />}
      >
        <Trash2 aria-hidden="true" className="size-3.5" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer « {filename} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            {usage === null
              ? "Vérification de l'utilisation…"
              : usage.length === 0
                ? "Ce média n'est utilisé nulle part sur le site."
                : `Ce média est utilisé à ${usage.length} endroit${usage.length > 1 ? "s" : ""}. La suppression retirera ces références :`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {usage !== null && usage.length > 0 && (
          <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg bg-muted p-2 text-xs">
            {usage.map((item, index) => (
              <li key={index} className="truncate">
                <span className="font-mono text-muted-foreground">{MEDIA_USAGE_KIND_LABEL[item.kind]} — </span>
                {item.label}
              </li>
            ))}
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
            {pending ? "Suppression…" : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
