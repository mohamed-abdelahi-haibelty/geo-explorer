"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, GripVertical, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CldImage } from "@/components/media/cld-image";
import { ServiceDeleteDialog } from "@/components/admin/service-delete-dialog";
import { useDragReorder } from "@/lib/hooks/use-drag-reorder";
import { reorderServicesAction, toggleServicePublishedAction } from "@/server/actions/services";
import { bestTranslation } from "@/lib/translation-display";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";
import type { listServicesAdmin } from "@/server/queries/services";

type ServiceRow = Awaited<ReturnType<typeof listServicesAdmin>>[number];

const LOCALE_LABEL: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

export function ServiceList({ services: initialServices }: { services: ServiceRow[] }) {
  const [services, setServices] = useState(initialServices);

  // Re-seed whenever the server sends a new list — see the identical note in
  // PartnerList: the optimistic local copy otherwise swallows every
  // router.refresh() after a create/edit/delete, leaving the table stale
  // until a manual page reload.
  const [seededServices, setSeededServices] = useState(initialServices);
  if (seededServices !== initialServices) {
    setSeededServices(initialServices);
    setServices(initialServices);
  }

  const { move, dragHandlers, isDropTarget } = useDragReorder(services, (next) => {
    setServices(next);
    reorderServicesAction({ orderedIds: next.map((service) => service.id) });
  });

  async function handleTogglePublished(id: string, published: boolean) {
    setServices((prev) => prev.map((service) => (service.id === id ? { ...service, published } : service)));
    const result = await toggleServicePublishedAction({ serviceId: id, published });
    if (!result.ok) {
      setServices((prev) => prev.map((service) => (service.id === id ? { ...service, published: !published } : service)));
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="w-14" />
            <TableHead>Service</TableHead>
            <TableHead>FR / EN / AR</TableHead>
            <TableHead>Publié</TableHead>
            <TableHead className="w-20 text-right">Ordre</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service, index) => {
            const translation = bestTranslation(service.translations);
            return (
              <TableRow key={service.id} {...dragHandlers(index)} className={isDropTarget(index) ? "border-secondary" : undefined}>
                <TableCell>
                  <span className="flex cursor-grab items-center text-muted-foreground active:cursor-grabbing" aria-hidden="true">
                    <GripVertical className="size-4" />
                  </span>
                </TableCell>
                <TableCell>
                  <div className="relative aspect-video w-12 overflow-hidden rounded-md bg-muted">
                    {service.hero && (
                      <CldImage publicId={service.hero.publicId} alt="" fill sizes="48px" blurDataUrl={service.hero.blurDataUrl} />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-foreground">{translation?.title ?? service.slug}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {LOCALES.map((locale) => {
                      const complete = service.translations.some((t) => t.locale === locale.toUpperCase());
                      return (
                        <Badge key={locale} variant={complete ? "default" : "outline"} className="px-1.5 text-[10px]">
                          {LOCALE_LABEL[locale]}
                        </Badge>
                      );
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={service.published}
                    onCheckedChange={(value) => handleTogglePublished(service.id, value)}
                    aria-label={`${service.published ? "Dépublier" : "Publier"} ${translation?.title ?? service.slug}`}
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
                      disabled={index === services.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label="Descendre"
                    >
                      <ChevronDown aria-hidden="true" className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      nativeButton={false}
                      render={<Link href={`/admin/services/${service.id}`} aria-label={`Modifier ${translation?.title ?? service.slug}`} />}
                    >
                      <Pencil aria-hidden="true" className="size-3.5" />
                    </Button>
                    <ServiceDeleteDialog id={service.id} title={translation?.title ?? service.slug} />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
