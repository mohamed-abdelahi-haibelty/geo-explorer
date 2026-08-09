"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteNewsAction, publishNewsAction, unpublishNewsAction } from "@/server/actions/news";
import { primaryTranslation } from "@/lib/translation-display";
import type { Locale as PrismaLocale, PublishStatus } from "@/prisma/generated/client";

const LOCALE_LABEL: Record<PrismaLocale, string> = { FR: "FR", EN: "EN", AR: "AR" };

// No preview action — unlike articles, news has no draft-preview route
// (out of Task 05's scope; Task 08 owns public news pages).
export function NewsRowActions({
  newsId,
  title,
  translations,
}: {
  newsId: string;
  title: string;
  translations: { locale: PrismaLocale; status: PublishStatus; translationId: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [unpublishError, setUnpublishError] = useState<string | null>(null);

  const primary = primaryTranslation(translations);

  function handlePublish() {
    if (!primary) return;
    startTransition(async () => {
      const result = await publishNewsAction(primary.translationId);
      if (result.ok) {
        toast.success(`« ${title} » (${LOCALE_LABEL[primary.locale]}) est publiée.`);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function handleUnpublish() {
    if (!primary) return;
    startTransition(async () => {
      const result = await unpublishNewsAction(primary.translationId);
      if (result.ok) {
        setUnpublishOpen(false);
        toast.success(`« ${title} » (${LOCALE_LABEL[primary.locale]}) est dépubliée.`);
        router.refresh();
      } else {
        setUnpublishError(result.message);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteNewsAction(newsId);
      if (result.ok) {
        setDeleteOpen(false);
        toast.success(`« ${title} » supprimée.`);
        router.refresh();
      } else {
        setDeleteError(result.message);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions pour ${title}`} />}
        >
          <MoreHorizontal aria-hidden="true" className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/actualites/${newsId}`} />}>
            <Pencil aria-hidden="true" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={primary?.status === "PUBLISHED" ? () => setUnpublishOpen(true) : handlePublish}
            disabled={pending || !primary}
          >
            {primary?.status === "PUBLISHED" ? <Undo2 aria-hidden="true" /> : <Send aria-hidden="true" />}
            {primary?.status === "PUBLISHED" ? "Dépublier" : "Publier"}
            {primary && ` (${LOCALE_LABEL[primary.locale]})`}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)} disabled={pending}>
            <Trash2 aria-hidden="true" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={unpublishOpen} onOpenChange={setUnpublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Dépublier « {title} » {primary && `(${LOCALE_LABEL[primary.locale]})`} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;actualité sera retirée du site public immédiatement et repassera en brouillon.
              {unpublishError && <span className="mt-2 block text-destructive">{unpublishError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction disabled={pending} onClick={handleUnpublish}>
              {pending ? "Dépublication…" : "Dépublier"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et retire l&apos;actualité de la liste et du site public.
              {deleteError && <span className="mt-2 block text-destructive">{deleteError}</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={pending} onClick={handleDelete}>
              {pending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
