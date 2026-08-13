import type { Metadata } from "next";
import { ServiceCreateDialog } from "@/components/admin/service-create-dialog";
import { ServiceList } from "@/components/admin/service-list";
import { listServicesAdmin } from "@/server/queries/services";

export const metadata: Metadata = { title: "Services — Back-office GeoExplorer Services" };

export default async function ServicesPage() {
  const services = await listServicesAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Services</h1>
          <p className="text-sm text-muted-foreground">
            Ordre d&apos;affichage, publication, icône, image et contenu par langue.
          </p>
        </div>
        <ServiceCreateDialog />
      </div>

      <ServiceList services={services} />
    </div>
  );
}
