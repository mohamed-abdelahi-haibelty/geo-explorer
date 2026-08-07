import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/admin/article-form";
import { listAuthors } from "@/server/queries/authors";
import { listTags } from "@/server/queries/tags";
import { pickLocalizedText } from "@/lib/locale";

export const metadata: Metadata = { title: "Nouvel article — Back-office GeoExplorer Services" };

export default async function NewArticlePage() {
  const [authors, tags] = await Promise.all([listAuthors(), listTags()]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/articles"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour aux articles
      </Link>
      <h1 className="font-heading text-2xl text-foreground">Nouvel article</h1>
      <ArticleForm
        article={null}
        authorSuggestions={authors.map((author) => ({
          id: author.id,
          name: author.name,
          photo: author.photo ? { publicId: author.photo.publicId, blurDataUrl: author.photo.blurDataUrl } : null,
        }))}
        tagSuggestions={tags.map((tag) => ({ id: tag.id, name: pickLocalizedText(tag.name, "fr") }))}
      />
    </div>
  );
}
