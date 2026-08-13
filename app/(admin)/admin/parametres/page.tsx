import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { getSiteSettingForEdit } from "@/server/queries/settings";

export const metadata: Metadata = { title: "Paramètres — Back-office GeoExplorer Services" };

export default async function ParametresPage() {
  const { setting, ogImage } = await getSiteSettingForEdit();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-foreground">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Coordonnées, réseaux et image de partage utilisés dans tout le site public.
        </p>
      </div>

      <SettingsForm setting={setting} ogImage={ogImage} />
    </div>
  );
}
