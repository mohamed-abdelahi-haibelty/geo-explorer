"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { ensureUniqueSlug } from "@/lib/slug";
import { createAuthorSchema, deleteAuthorSchema, updateAuthorSchema } from "@/lib/validation/authors";
import { getAuthorArticleCount } from "@/server/queries/authors";
import { Prisma } from "@/prisma/generated/client";
import type { Author } from "@/prisma/generated/client";

// title_fr/title_en/title_ar (and bio_*) — six flat named inputs rather than
// a JSON-stringified hidden field, chosen for this dialog to keep each value
// individually inspectable; the Zod schema below validates plain optional
// strings instead of parsing an opaque blob. fr absent ⇒ the whole field is
// treated as unset, matching "no title/bio at all".
function localizedFromFormData(formData: FormData, key: string): { fr: string; en?: string; ar?: string } | undefined {
  const fr = String(formData.get(`${key}_fr`) ?? "").trim();
  if (!fr) return undefined;
  const en = String(formData.get(`${key}_en`) ?? "").trim();
  const ar = String(formData.get(`${key}_ar`) ?? "").trim();
  return { fr, ...(en ? { en } : {}), ...(ar ? { ar } : {}) };
}

function fieldsFromFormData(formData: FormData) {
  return {
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    title: localizedFromFormData(formData, "title"),
    bio: localizedFromFormData(formData, "bio"),
    email: formData.get("email") || undefined,
    linkedin: formData.get("linkedin") || undefined,
    photoId: formData.get("photoId") || undefined,
  };
}

export async function createAuthor(
  _prevState: ActionResult<Author> | null,
  formData: FormData,
): Promise<ActionResult<Author>> {
  return runAction(async () => {
    const parsed = createAuthorSchema.safeParse(fieldsFromFormData(formData));
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.slug || data.name, (candidate) =>
      db.author.findUnique({ where: { slug: candidate }, select: { id: true } }).then((row) => row !== null),
    );

    const author = await db.author.create({
      data: {
        name: data.name,
        slug,
        title: data.title ? (data.title as Prisma.InputJsonValue) : Prisma.DbNull,
        bio: data.bio ? (data.bio as Prisma.InputJsonValue) : Prisma.DbNull,
        email: data.email ?? null,
        linkedin: data.linkedin ?? null,
        photoId: data.photoId ?? null,
      },
    });

    updateTag(TAGS.authors);
    await logAudit({ userId: user.id, action: "author.create", entity: "Author", entityId: author.id });

    return author;
  });
}

export async function updateAuthor(
  _prevState: ActionResult<Author> | null,
  formData: FormData,
): Promise<ActionResult<Author>> {
  return runAction(async () => {
    const parsed = updateAuthorSchema.safeParse({ id: formData.get("id"), ...fieldsFromFormData(formData) });
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.slug || data.name, (candidate) =>
      db.author
        .findFirst({ where: { slug: candidate, NOT: { id: data.id } }, select: { id: true } })
        .then((row) => row !== null),
    );

    const author = await db.author.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        title: data.title ? (data.title as Prisma.InputJsonValue) : Prisma.DbNull,
        bio: data.bio ? (data.bio as Prisma.InputJsonValue) : Prisma.DbNull,
        email: data.email ?? null,
        linkedin: data.linkedin ?? null,
        photoId: data.photoId ?? null,
      },
    });

    updateTag(TAGS.authors);
    await logAudit({ userId: user.id, action: "author.update", entity: "Author", entityId: author.id });

    return author;
  });
}

export async function deleteAuthor(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteAuthorSchema.safeParse({ id });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const articleCount = await getAuthorArticleCount(parsed.data.id);
    if (articleCount > 0) {
      throw new AppError(
        "CONFLICT",
        `Impossible de supprimer : ${articleCount} article${articleCount > 1 ? "s" : ""} référence${articleCount > 1 ? "nt" : ""} encore cet auteur.`,
      );
    }

    const author = await db.author.delete({ where: { id: parsed.data.id } });

    updateTag(TAGS.authors);
    await logAudit({ userId: user.id, action: "author.delete", entity: "Author", entityId: author.id });

    return null;
  });
}

export async function getAuthorArticleCountAction(id: string): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireSession();
    return getAuthorArticleCount(id);
  });
}
