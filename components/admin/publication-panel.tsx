"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Eye, Send, Trash2, Undo2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { PublishStatus } from "@/prisma/generated/client";

const STATUS_LABEL: Record<PublishStatus, string> = { DRAFT: "Brouillon", PUBLISHED: "Publié", ARCHIVED: "Archivé" };
const STATUS_VARIANT: Record<PublishStatus, "secondary" | "default" | "outline"> = {
  DRAFT: "secondary",
  PUBLISHED: "default",
  ARCHIVED: "outline",
};
const LOCALE_LABELS: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

export type LocalePublicationSummary = { status: PublishStatus; translationId: string | null };

// One panel, not three — a compact per-locale status
// strip plus the action buttons, which act on whichever locale tab is
// currently active. Shared by the article and news forms;
// `extra` is the only entity-specific slot left (article's "mise en avant"
// switch — news has nothing to put there) and `onPreview` is optional since
// news has no draft-preview route, unlike articles.
export function PublicationPanel({
  entityId,
  entityLabel,
  summaries,
  activeLocale,
  saving,
  publishing,
  saveLabel,
  onSave,
  onPreview,
  onPublish,
  onUnpublish,
  onDelete,
  extra,
}: {
  entityId: string | null;
  entityLabel: string;
  summaries: Record<LocaleCode, LocalePublicationSummary>;
  activeLocale: LocaleCode;
  saving: boolean;
  publishing: boolean;
  saveLabel: string;
  onSave: () => void;
  onPreview?: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  extra?: ReactNode;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const activeSummary = summaries[activeLocale];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-foreground">Statut par langue</span>
        <ul className="flex flex-col gap-1">
          {LOCALES.map((locale) => {
            const summary = summaries[locale];
            return (
              <li key={locale} className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">{LOCALE_LABELS[locale]}</span>
                {summary.translationId ? (
                  <Badge variant={STATUS_VARIANT[summary.status]}>{STATUS_LABEL[summary.status]}</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    —
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {extra && <div className="border-t border-border pt-3">{extra}</div>}

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          Actions pour : {LOCALE_LABELS[activeLocale]}
        </p>
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {saveLabel}
        </p>

        <Button type="button" variant="outline" onClick={onSave} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le brouillon"}
        </Button>
        {onPreview && (
          <Button type="button" variant="outline" onClick={onPreview} disabled={saving}>
            <Eye aria-hidden="true" />
            Prévisualiser
          </Button>
        )}
        {activeSummary.status === "PUBLISHED" ? (
          <Button type="button" variant="secondary" onClick={onUnpublish} disabled={publishing}>
            <Undo2 aria-hidden="true" />
            Dépublier
          </Button>
        ) : (
          <Button type="button" onClick={onPublish} disabled={publishing}>
            <Send aria-hidden="true" />
            {publishing ? "Publication…" : "Publier"}
          </Button>
        )}
      </div>

      {entityId && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogTrigger
              render={<Button type="button" variant="ghost" size="sm" className="justify-start text-destructive hover:text-destructive" />}
            >
              <Trash2 aria-hidden="true" className="size-3.5" />
              Supprimer
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer {entityLabel} ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est définitive et la retire — toutes ses langues — de la liste, du site public et de
                  toute page qui la référence.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    setDeleteOpen(false);
                    onDelete();
                  }}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
