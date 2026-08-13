import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageSectionForm } from "@/components/admin/page-section-form";
import { listPageSectionsForAdmin } from "@/server/queries/page-sections";
import { PAGE_SLUG_TO_KEY, PAGE_LABEL, SECTION_LABEL } from "@/lib/page-keys";

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  const pageKey = PAGE_SLUG_TO_KEY[page];
  return { title: `${pageKey ? PAGE_LABEL[pageKey] : "Page"} — Back-office GeoExplorer Services` };
}

export default async function PageSectionsPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const pageKey = PAGE_SLUG_TO_KEY[page];
  if (!pageKey) notFound();

  const { rows, imagesById } = await listPageSectionsForAdmin(pageKey);

  const keysInOrder: string[] = [];
  for (const row of rows) {
    if (!keysInOrder.includes(row.key)) keysInOrder.push(row.key);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Link href="/admin/pages" className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Pages
        </Link>
        <h1 className="font-heading text-2xl text-foreground">{PAGE_LABEL[pageKey]}</h1>
        <p className="text-sm text-muted-foreground">
          Chaque section se sauvegarde indépendamment, par langue. Une section non traduite affiche le contenu
          français en repli sur le site public.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {keysInOrder.map((key) => (
          <PageSectionForm
            key={key}
            page={pageKey}
            sectionKey={key}
            label={SECTION_LABEL[`${pageKey}:${key}`] ?? key}
            rows={rows.filter((row) => row.key === key)}
            images={imagesById}
          />
        ))}
      </div>
    </div>
  );
}
