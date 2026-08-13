import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, PanelsTopLeft } from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listPageSectionCompleteness } from "@/server/queries/page-sections";
import { LOCALES } from "@/lib/validation/locale";
import { PAGE_LABEL, PAGE_KEY_TO_SLUG, SECTION_LABEL } from "@/lib/page-keys";

export const metadata: Metadata = { title: "Pages — Back-office GeoExplorer Services" };

const LOCALE_LABEL: Record<string, string> = { fr: "FR", en: "EN", ar: "AR" };

// The completeness table (showing which structural sections are still
// untranslated) now doubles as the index into the real editor — each row
// links to /admin/pages/[page], where editing happens. GLOBAL has no seeded
// rows and no editor route; it's excluded from PAGE_KEY_TO_SLUG so it simply
// has no link (still listed if it ever gets rows).
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
          manquante affiche le contenu français en repli, marqué non indexable.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>FR / EN / AR</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => {
              const slug = PAGE_KEY_TO_SLUG[section.page];
              return (
                <TableRow key={`${section.page}:${section.key}`}>
                  <TableCell className="font-medium text-foreground">{PAGE_LABEL[section.page] ?? section.page}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {SECTION_LABEL[`${section.page}:${section.key}`] ?? section.key}
                  </TableCell>
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
                  <TableCell>
                    {slug && (
                      <Link
                        href={`/admin/pages/${slug}`}
                        aria-label={`Modifier ${PAGE_LABEL[section.page] ?? section.page}`}
                        className="flex items-center justify-center text-muted-foreground hover:text-foreground"
                      >
                        <ChevronRight aria-hidden="true" className="size-4" />
                      </Link>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
