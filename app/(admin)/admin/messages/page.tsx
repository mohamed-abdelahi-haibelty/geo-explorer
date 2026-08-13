import { Download, Mail } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { MessageFilters } from "@/components/admin/message-filters";
import { MessageRow } from "@/components/admin/message-row";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listMessagesAdmin } from "@/server/queries/messages";
import { contactStatusSchema } from "@/lib/validation/contact";
import type { Metadata } from "next";
import type { ContactStatus } from "@/prisma/generated/client";

export const metadata: Metadata = { title: "Messages — Back-office GeoExplorer Services" };

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const parsedStatus = contactStatusSchema.safeParse(params.status);
  const status: ContactStatus | undefined = parsedStatus.success ? parsedStatus.data : undefined;
  const page = Math.max(1, Number(params.page) || 1);

  const { items, total, pageCount } = await listMessagesAdmin({ status, page });
  const hasFilter = Boolean(status);

  function buildHref(targetPage: number) {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (targetPage > 1) next.set("page", String(targetPage));
    const qs = next.toString();
    return qs ? `/admin/messages?${qs}` : "/admin/messages";
  }

  const exportHref = status ? `/admin/messages/export?status=${status}` : "/admin/messages/export";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {total} message{total > 1 ? "s" : ""} reçu{total > 1 ? "s" : ""} depuis le formulaire de contact.
          </p>
        </div>
        <Button type="button" variant="outline" nativeButton={false} render={<a href={exportHref} />}>
          <Download aria-hidden="true" />
          Exporter en CSV
        </Button>
      </div>

      <MessageFilters status={params.status} />

      {items.length === 0 ? (
        <EmptyState
          icon={Mail}
          title={hasFilter ? "Aucun résultat" : "Aucun message"}
          description={hasFilter ? "Aucun message ne correspond à ce statut." : "Les demandes envoyées depuis /contact apparaîtront ici."}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statut</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Type de projet</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Notification</TableHead>
                <TableHead>Reçu</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((message) => (
                <MessageRow key={message.id} message={message} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {pageCount > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                text="Précédent"
                href={buildHref(Math.max(1, page - 1))}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 font-mono text-xs text-muted-foreground">
                Page {page} / {pageCount}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                text="Suivant"
                href={buildHref(Math.min(pageCount, page + 1))}
                className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
