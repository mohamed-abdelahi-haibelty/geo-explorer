import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/news-form";

export const metadata: Metadata = { title: "Nouvelle actualité — Back-office GeoExplorer Services" };

export default function NewActualitePage() {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/actualites"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour aux actualités
      </Link>
      <h1 className="font-heading text-2xl text-foreground">Nouvelle actualité</h1>
      <NewsForm news={null} />
    </div>
  );
}
