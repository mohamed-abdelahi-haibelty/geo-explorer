"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

// One panel, not three (Task 04a's decision) — a compact per-locale status
// strip plus the action buttons, which act on whichever locale tab is
// currently active. The "Actions pour : {locale}" line exists so "Publier"
// is never ambiguous about which translation it targets.
export function ArticlePublicationPanel({
  articleId,
  summaries,
  activeLocale,
  featured,
  onFeaturedChange,
  saving,
  publishing,
  saveLabel,
  onSave,
  onPreview,
  onPublish,
  onUnpublish,
  onDelete,
}: {
  articleId: string | null;
  summaries: Record<LocaleCode, LocalePublicationSummary>;
  activeLocale: LocaleCode;
  featured: boolean;
  onFeaturedChange: (value: boolean) => void;
  saving: boolean;
  publishing: boolean;
  saveLabel: string;
  onSave: () => void;
  onPreview: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
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

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Label htmlFor="article-featured" className="flex flex-col gap-0.5">
          <span>Mise en avant</span>
          <span className="text-xs font-normal text-muted-foreground">Affiché en priorité sur l&apos;accueil</span>
        </Label>
        <Switch id="article-featured" checked={featured} onCheckedChange={onFeaturedChange} />
      </div>

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
        <Button type="button" variant="outline" onClick={onPreview} disabled={saving}>
          <Eye aria-hidden="true" />
          Prévisualiser
        </Button>
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

      {articleId && (
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
                <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est définitive et retire l&apos;article — toutes ses langues — de la liste, du site
                  public et de toute page qui le référence.
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
