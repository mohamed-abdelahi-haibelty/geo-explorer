"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Archive, ArchiveRestore, Mail, MailOpen, MoreHorizontal, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TableCell, TableRow } from "@/components/ui/table";
import { updateContactStatusAction } from "@/server/actions/messages";
import type { listMessagesAdmin } from "@/server/queries/messages";
import type { ContactStatus } from "@/prisma/generated/client";

type MessageRowData = Awaited<ReturnType<typeof listMessagesAdmin>>["items"][number];

const STATUS_LABEL: Record<ContactStatus, string> = { NEW: "Nouveau", READ: "Lu", ARCHIVED: "Archivé", SPAM: "Indésirable" };
const STATUS_VARIANT: Record<ContactStatus, "default" | "secondary" | "outline" | "destructive"> = {
  NEW: "default",
  READ: "secondary",
  ARCHIVED: "outline",
  SPAM: "destructive",
};
const LOCALE_LABEL: Record<string, string> = { FR: "FR", EN: "EN", AR: "AR" };

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

// One row is both the table row and its own detail Sheet — no separate
// /admin/messages/[id] route, since there's nothing here that needs a
// dedicated URL (no long-form editing, just reading and a status change).
// Opening the sheet on a NEW message marks it READ, matching how every
// mail client's own inbox behaves and keeping the unread count updated
// immediately after a message is read, without a separate explicit control.
export function MessageRow({ message }: { message: MessageRowData }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<ContactStatus>(message.status);
  const autoReadRef = useRef(false);

  function changeStatus(next: ContactStatus) {
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateContactStatusAction({ id: message.id, status: next });
      if (result.ok) {
        router.refresh();
      } else {
        setStatus(previous);
        toast.error(result.message);
      }
    });
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && status === "NEW" && !autoReadRef.current) {
      autoReadRef.current = true;
      changeStatus("READ");
    }
  }

  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => handleOpenChange(true)}>
        <TableCell>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </TableCell>
        <TableCell className="max-w-40 truncate font-medium text-foreground">{message.name}</TableCell>
        <TableCell className="max-w-48 truncate text-sm text-muted-foreground" dir="ltr">
          {message.email}
        </TableCell>
        <TableCell className="max-w-40 truncate text-sm text-muted-foreground">{message.projectType ?? "—"}</TableCell>
        <TableCell>
          <span className="font-mono text-[10px] text-muted-foreground">{LOCALE_LABEL[message.locale]}</span>
        </TableCell>
        <TableCell>
          {message.status === "SPAM" ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : message.emailSent ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MailOpen aria-hidden="true" className="size-3.5" />
              Envoyé
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 text-xs text-destructive"
              title={message.emailError ?? "Échec d'envoi"}
            >
              <AlertTriangle aria-hidden="true" className="size-3.5" />
              Échec
            </span>
          )}
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground">
          {new Date(message.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
        </TableCell>
        <TableCell onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions pour ${message.name}`} />}>
              <MoreHorizontal aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {status !== "READ" && status !== "ARCHIVED" && (
                <DropdownMenuItem onClick={() => changeStatus("READ")} disabled={pending}>
                  <Mail aria-hidden="true" />
                  Marquer comme lu
                </DropdownMenuItem>
              )}
              {status !== "ARCHIVED" && (
                <DropdownMenuItem onClick={() => changeStatus("ARCHIVED")} disabled={pending}>
                  <Archive aria-hidden="true" />
                  Archiver
                </DropdownMenuItem>
              )}
              {status !== "SPAM" && (
                <DropdownMenuItem onClick={() => changeStatus("SPAM")} disabled={pending}>
                  <ShieldAlert aria-hidden="true" />
                  Marquer indésirable
                </DropdownMenuItem>
              )}
              {(status === "ARCHIVED" || status === "SPAM") && (
                <DropdownMenuItem onClick={() => changeStatus("NEW")} disabled={pending}>
                  <ArchiveRestore aria-hidden="true" />
                  Remettre en nouveau
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{message.name}</SheetTitle>
            <SheetDescription>{formatDateTime(message.createdAt)}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">Langue : {LOCALE_LABEL[message.locale]}</span>
            </div>

            <dl className="flex flex-col gap-2 text-sm">
              {message.company && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Société</dt>
                  <dd className="text-foreground">{message.company}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">E-mail</dt>
                <dd dir="ltr" className="text-foreground">
                  {message.email}
                </dd>
              </div>
              {message.phone && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Téléphone</dt>
                  <dd dir="ltr" className="text-foreground">
                    {message.phone}
                  </dd>
                </div>
              )}
              {message.projectType && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Type de projet</dt>
                  <dd className="text-foreground">{message.projectType}</dd>
                </div>
              )}
            </dl>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Message</p>
              <p className="text-sm whitespace-pre-line text-foreground">{message.message}</p>
            </div>

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">Envoi de la notification</p>
              {message.status === "SPAM" ? (
                <p className="text-sm text-muted-foreground">
                  Marqué indésirable — aucune notification n&apos;a été envoyée.
                </p>
              ) : message.emailSent ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-foreground">
                  <MailOpen aria-hidden="true" className="size-4 text-muted-foreground" />
                  Notification envoyée par e-mail.
                </p>
              ) : (
                <p className="inline-flex items-start gap-1.5 text-sm text-destructive">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{message.emailError ?? "L'envoi de la notification a échoué."}</span>
                </p>
              )}
            </div>
          </div>

          <SheetFooter>
            <Button type="button" nativeButton={false} render={<a href={`mailto:${message.email}`} />}>
              <Mail aria-hidden="true" />
              Répondre par e-mail
            </Button>
            <div className="flex gap-2">
              {status !== "ARCHIVED" && (
                <Button type="button" variant="outline" className="flex-1" onClick={() => changeStatus("ARCHIVED")} disabled={pending}>
                  Archiver
                </Button>
              )}
              {status !== "SPAM" && (
                <Button type="button" variant="outline" className="flex-1" onClick={() => changeStatus("SPAM")} disabled={pending}>
                  Indésirable
                </Button>
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
