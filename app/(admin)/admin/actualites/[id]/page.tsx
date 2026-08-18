import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { NewsForm } from "@/components/admin/news-form";
import { getNewsForEdit } from "@/server/queries/news";
import { bestTranslation } from "@/lib/translation-display";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const news = await getNewsForEdit(id);
  const title = news ? bestTranslation(news.translations)?.title : null;
  return { title: title ? `${title} — Back-office GeoExplorer Services` : "Actualité introuvable" };
}

export default async function EditActualitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await getNewsForEdit(id);
  if (!news) notFound();

  const heading = bestTranslation(news.translations)?.title ?? "Actualité sans titre";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/actualites"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour aux actualités
      </Link>
      <h1 className="font-heading text-2xl text-foreground">{heading}</h1>
      {/* key — see the note on the sibling "nouveau" page: without it,
          navigating between two records reuses one form instance. */}
      <NewsForm key={news.id} news={news} />
    </div>
  );
}
