import type { Metadata } from "next";
import { Handshake } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { PartnerFormDialog } from "@/components/admin/partner-form-dialog";
import { PartnerList } from "@/components/admin/partner-list";
import { listPartnersAdmin } from "@/server/queries/partners";

export const metadata: Metadata = { title: "Partenaires — Back-office GeoExplorer Services" };

export default async function PartenairesPage() {
  const partners = await listPartnersAdmin();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Partenaires</h1>
          <p className="text-sm text-muted-foreground">Logos et catégories affichés dans « Ils nous font confiance ».</p>
        </div>
        <PartnerFormDialog />
      </div>

      {partners.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title="Aucun partenaire"
          description="La liste des partenaires (noms, logos) reste à fournir par le client."
        />
      ) : (
        <PartnerList partners={partners} />
      )}
    </div>
  );
}
