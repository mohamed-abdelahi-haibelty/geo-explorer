import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/admin/service-form";
import { getServiceForEdit } from "@/server/queries/services";
import { bestTranslation } from "@/lib/translation-display";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceForEdit(id);
  const title = service ? (bestTranslation(service.translations)?.title ?? service.slug) : "Service";
  return { title: `${title} — Back-office GeoExplorer Services` };
}

export default async function ServiceEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const service = await getServiceForEdit(id);
  if (!service) notFound();

  const title = bestTranslation(service.translations)?.title ?? service.slug;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/admin/services" className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Services
        </Link>
        <h1 className="font-heading text-2xl text-foreground">{title}</h1>
      </div>

      <ServiceForm service={service} />
    </div>
  );
}
