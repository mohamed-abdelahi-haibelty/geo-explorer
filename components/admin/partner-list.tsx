"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CldImage } from "@/components/media/cld-image";
import { PartnerFormDialog } from "@/components/admin/partner-form-dialog";
import { PartnerDeleteDialog } from "@/components/admin/partner-delete-dialog";
import { useDragReorder } from "@/lib/hooks/use-drag-reorder";
import { reorderPartnersAction, togglePartnerPublishedAction } from "@/server/actions/partners";
import { pickLocalizedText } from "@/lib/locale";
import type { listPartnersAdmin } from "@/server/queries/partners";

type PartnerRow = Awaited<ReturnType<typeof listPartnersAdmin>>[number];

// Combines the Author dialog's CRUD pattern with the Service list's
// drag+chevron reorder — Partner is the one entity in this task that needs
// both at once (Author has no reorder; Service's editing lives on its own
// route, not a dialog).
export function PartnerList({ partners: initialPartners }: { partners: PartnerRow[] }) {
  const [partners, setPartners] = useState(initialPartners);

  const { move, dragHandlers, isDropTarget } = useDragReorder(partners, (next) => {
    setPartners(next);
    reorderPartnersAction({ orderedIds: next.map((partner) => partner.id) });
  });

  async function handleTogglePublished(id: string, published: boolean) {
    setPartners((prev) => prev.map((partner) => (partner.id === id ? { ...partner, published } : partner)));
    const result = await togglePartnerPublishedAction({ id, published });
    if (!result.ok) {
      setPartners((prev) => prev.map((partner) => (partner.id === id ? { ...partner, published: !published } : partner)));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="w-14" />
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Publié</TableHead>
            <TableHead className="w-20 text-right">Ordre</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner, index) => (
            <TableRow key={partner.id} {...dragHandlers(index)} className={isDropTarget(index) ? "border-secondary" : undefined}>
              <TableCell>
                <span className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                  <GripVertical className="size-4" />
                </span>
              </TableCell>
              <TableCell>
                <div className="relative flex size-10 items-center justify-center overflow-hidden rounded-md bg-muted text-xs font-medium text-muted-foreground">
                  {partner.logo ? (
                    <CldImage publicId={partner.logo.publicId} alt="" fill sizes="40px" blurDataUrl={partner.logo.blurDataUrl} />
                  ) : (
                    partner.name.charAt(0).toUpperCase()
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">{partner.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {pickLocalizedText(partner.category, "fr") || <Badge variant="outline">—</Badge>}
              </TableCell>
              <TableCell>
                <Switch
                  checked={partner.published}
                  onCheckedChange={(value) => handleTogglePublished(partner.id, value)}
                  aria-label={`${partner.published ? "Dépublier" : "Publier"} ${partner.name}`}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Monter">
                    <ChevronUp aria-hidden="true" className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === partners.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label="Descendre"
                  >
                    <ChevronDown aria-hidden="true" className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <PartnerFormDialog partner={partner} />
                  <PartnerDeleteDialog id={partner.id} name={partner.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
