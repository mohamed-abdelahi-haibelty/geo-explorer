import type { Metadata } from "next";
import { Users } from "lucide-react";
import { AuthorDeleteDialog } from "@/components/admin/author-delete-dialog";
import { AuthorFormDialog } from "@/components/admin/author-form-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { CldImage } from "@/components/media/cld-image";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAuthors } from "@/server/queries/authors";
import { pickLocalizedText } from "@/lib/locale";

export const metadata: Metadata = { title: "Auteurs — Back-office GeoExplorer Services" };

export default async function AuteursPage() {
  const authors = await listAuthors();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-heading text-2xl text-foreground">Auteurs</h1>
          <p className="text-sm text-muted-foreground">
            Chercheurs crédités sur les articles techniques — nom, fonction, photo et biographie.
          </p>
        </div>
        <AuthorFormDialog />
      </div>

      {authors.length === 0 ? (
        <EmptyState icon={Users} title="Aucun auteur" description="Créez le premier auteur pour pouvoir lui attribuer des articles." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12" />
                <TableHead>Nom</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead className="text-right">Articles</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((author) => (
                <TableRow key={author.id}>
                  <TableCell>
                    <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {author.photo ? (
                        <CldImage publicId={author.photo.publicId} alt="" fill sizes="32px" blurDataUrl={author.photo.blurDataUrl} />
                      ) : (
                        author.name.charAt(0).toUpperCase()
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{author.name}</TableCell>
                  <TableCell className="text-muted-foreground">{pickLocalizedText(author.title, "fr") || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">{author._count.articles}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <AuthorFormDialog author={author} />
                      <AuthorDeleteDialog id={author.id} name={author.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
