import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleForEdit } from "@/server/queries/articles";
import { listAuthors } from "@/server/queries/authors";
import { listTags } from "@/server/queries/tags";
import { pickLocalizedText } from "@/lib/locale";
import { bestTranslation } from "@/lib/translation-display";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleForEdit(id);
  const title = article ? bestTranslation(article.translations)?.title : null;
  return { title: title ? `${title} — Back-office GeoExplorer Services` : "Article introuvable" };
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [article, authors, tags] = await Promise.all([getArticleForEdit(id), listAuthors(), listTags()]);
  if (!article) notFound();

  const heading = bestTranslation(article.translations)?.title ?? "Article sans titre";

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/articles"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Retour aux articles
      </Link>
      <h1 className="font-heading text-2xl text-foreground">{heading}</h1>
      {/* key — see the note on the sibling "nouveau" page: without it,
          navigating between two records reuses one form instance. */}
      <ArticleForm
        key={article.id}
        article={article}
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
