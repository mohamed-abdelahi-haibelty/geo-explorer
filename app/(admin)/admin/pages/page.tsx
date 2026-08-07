import type { Metadata } from "next";
import { PanelsTopLeft } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPageSectionCompleteness } from "@/server/queries/page-sections";
import { LOCALES } from "@/lib/validation/locale";

export const metadata: Metadata = { title: "Pages — Back-office GeoExplorer Services" };

const PAGE_LABEL: Record<string, string> = {
  HOME: "Accueil",
  ABOUT: "À propos",
  SERVICES: "Services",
  CONTACT: "Contact",
  GLOBAL: "Global",
};
const LOCALE_LABEL: Record<string, string> = { fr: "FR", en: "EN", ar: "AR" };

// Read-only — the concrete implementation of "the admin shows which
// structural sections are still untranslated" (Task 04a). Editing PageSection
// content is Task 06's scope; this only proves the fallback mechanics.
export default async function PagesPage() {
  const sections = await listPageSectionCompleteness();

  if (sections.length === 0) {
    return <EmptyState icon={PanelsTopLeft} title="Pages" description="Aucune section de page n'existe encore." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-foreground">Pages</h1>
        <p className="text-sm text-muted-foreground">
          Complétude par langue des sections structurelles (accueil, à propos, services, contact). Une langue
          manquante affiche le contenu français en repli, marqué non indexable — voir architecture.md.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>FR / EN / AR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={`${section.page}:${section.key}`}>
                <TableCell className="font-medium text-foreground">{PAGE_LABEL[section.page] ?? section.page}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{section.key}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {LOCALES.map((locale) => {
                      const complete = section.locales.has(locale.toUpperCase());
                      return (
                        <span key={locale} className="flex flex-col items-center gap-0.5">
                          <span className="font-mono text-[9px] text-muted-foreground">{LOCALE_LABEL[locale]}</span>
                          <Badge variant={complete ? "default" : "outline"} className="px-1.5 text-[10px]">
                            {complete ? "✓" : "—"}
                          </Badge>
                        </span>
                      );
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
