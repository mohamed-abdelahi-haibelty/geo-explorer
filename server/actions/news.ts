"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { processContent } from "@/server/services/content";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { ensureUniqueSlug } from "@/lib/slug";
import { toDbLocale, fromDbLocale } from "@/lib/locale";
import {
  createNewsSchema,
  createNewsTranslationSchema,
  deleteNewsSchema,
  publishNewsSchema,
  unpublishNewsSchema,
  updateNewsSchema,
} from "@/lib/validation/news";
import { getNewsForEdit } from "@/server/queries/news";
import { Prisma } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

type SavedTranslation = {
  newsId: string;
  translationId: string;
  locale: LocaleCode;
  slug: string;
  updatedAt: string;
  status: string;
};

type GalleryInput = { mediaId: string; caption: Record<string, string | undefined> }[];

// Full replace, ordered by array index — same rule Article's authors/tags
// follow (Task 04a step 10: shared fields are resubmitted on every
// translation save). Runs inside the caller's transaction so a
// half-replaced gallery never becomes visible.
function replaceGallery(tx: Prisma.TransactionClient, newsId: string, media: GalleryInput) {
  return Promise.all([
    tx.newsMedia.deleteMany({ where: { newsId } }),
    ...(media.length > 0
      ? [
          tx.newsMedia.createMany({
            data: media.map((item, index) => ({
              newsId,
              mediaId: item.mediaId,
              position: index,
              caption: item.caption as Prisma.InputJsonValue,
            })),
          }),
        ]
      : []),
  ]);
}

// Brand-new news item: parent (locale-independent fields) + its first
// translation + its gallery, in one transaction.
export async function createNewsAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = createNewsSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;
    const dbLocale = toDbLocale(data.locale);

    const slug = await ensureUniqueSlug(data.slug || data.title, (candidate) =>
      db.newsTranslation
        .findFirst({ where: { locale: dbLocale, slug: candidate }, select: { id: true } })
        .then((row) => row !== null),
    );
    const pipeline = processContent(data.contentJson, data.excerpt);

    const translation = await db.$transaction(async (tx) => {
      const news = await tx.news.create({
        data: {
          coverId: data.coverId ?? null,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          location: data.location || null,
          externalVideoUrl: data.externalVideoUrl || null,
          createdById: user.id,
        },
      });
      await replaceGallery(tx, news.id, data.media);
      return tx.newsTranslation.create({
        data: {
          newsId: news.id,
          locale: dbLocale,
          slug,
          title: data.title,
          excerpt: pipeline.excerpt || null,
          contentJson: data.contentJson as Prisma.InputJsonValue,
          contentHtml: pipeline.contentHtml,
          plainText: pipeline.plainText,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    updateTag(TAGS.news);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "news.create", entity: "News", entityId: translation.newsId });

    return {
      newsId: translation.newsId,
      translationId: translation.id,
      locale: data.locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

// Fills a previously-empty locale tab on an existing news item. Shared
// fields (cover/event/location/video/gallery) are re-written on the parent
// here too — the form always submits their current state regardless of
// which tab is being saved (mirrors createArticleTranslationAction).
export async function createNewsTranslationAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = createNewsTranslationSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;
    const dbLocale = toDbLocale(data.locale);

    const existingNews = await db.news.findUnique({ where: { id: data.newsId }, select: { id: true } });
    if (!existingNews) throw new AppError("NOT_FOUND", "Actualité introuvable.");

    const existingTranslation = await db.newsTranslation.findUnique({
      where: { newsId_locale: { newsId: data.newsId, locale: dbLocale } },
      select: { id: true },
    });
    if (existingTranslation) throw new AppError("CONFLICT", "Cette langue existe déjà pour cette actualité.");

    const slug = await ensureUniqueSlug(data.slug || data.title, (candidate) =>
      db.newsTranslation
        .findFirst({ where: { locale: dbLocale, slug: candidate }, select: { id: true } })
        .then((row) => row !== null),
    );
    const pipeline = processContent(data.contentJson, data.excerpt);

    const translation = await db.$transaction(async (tx) => {
      await tx.news.update({
        where: { id: data.newsId },
        data: {
          coverId: data.coverId ?? null,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          location: data.location || null,
          externalVideoUrl: data.externalVideoUrl || null,
        },
      });
      await replaceGallery(tx, data.newsId, data.media);
      return tx.newsTranslation.create({
        data: {
          newsId: data.newsId,
          locale: dbLocale,
          slug,
          title: data.title,
          excerpt: pipeline.excerpt || null,
          contentJson: data.contentJson as Prisma.InputJsonValue,
          contentHtml: pipeline.contentHtml,
          plainText: pipeline.plainText,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    updateTag(TAGS.news);
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: "news.translation.create",
      entity: "News",
      entityId: data.newsId,
      diff: { locale: data.locale },
    });

    return {
      newsId: data.newsId,
      translationId: translation.id,
      locale: data.locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

export async function updateNewsAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = updateNewsSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const existing = await db.newsTranslation.findUnique({
      where: { id: data.translationId },
      select: { id: true, newsId: true, locale: true, updatedAt: true, publishedAt: true, slug: true },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Actualité introuvable.");

    // Concurrent-edit guard (Task 05 step 7), scoped to the translation row —
    // identical shape to updateArticleAction so the client's conflict UI is
    // the same code path for both entities.
    if (!data.force && existing.updatedAt.toISOString() !== data.updatedAt) {
      throw new AppError("CONFLICT", "Cette actualité a été modifiée ailleurs depuis son chargement.", {
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    const slugChanged = Boolean(data.slug) && data.slug !== existing.slug;
    if (slugChanged && existing.publishedAt) {
      throw new AppError("VALIDATION", "Le slug est verrouillé après la première publication.", {
        slug: "Le slug est verrouillé après la première publication.",
      });
    }

    const slug = slugChanged
      ? await ensureUniqueSlug(data.slug!, (candidate) =>
          db.newsTranslation
            .findFirst({
              where: { locale: existing.locale, slug: candidate, NOT: { id: data.translationId } },
              select: { id: true },
            })
            .then((row) => row !== null),
        )
      : existing.slug;

    const pipeline = processContent(data.contentJson, data.excerpt);

    const translation = await db.$transaction(async (tx) => {
      // Bumps the parent's bookkeeping `updatedAt` as a side effect — "any-
      // locale last-touched", never used for the conflict check above.
      await tx.news.update({
        where: { id: existing.newsId },
        data: {
          coverId: data.coverId ?? null,
          eventDate: data.eventDate ? new Date(data.eventDate) : null,
          location: data.location || null,
          externalVideoUrl: data.externalVideoUrl || null,
        },
      });
      await replaceGallery(tx, existing.newsId, data.media);
      return tx.newsTranslation.update({
        where: { id: data.translationId },
        data: {
          slug,
          title: data.title,
          excerpt: pipeline.excerpt || null,
          contentJson: data.contentJson as Prisma.InputJsonValue,
          contentHtml: pipeline.contentHtml,
          plainText: pipeline.plainText,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.news);
    updateTag(TAGS.newsList(locale));
    updateTag(TAGS.newsItem(locale, translation.slug));
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "news.update", entity: "News", entityId: existing.newsId, diff: { locale } });

    return {
      newsId: existing.newsId,
      translationId: translation.id,
      locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

export async function publishNewsAction(translationId: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = publishNewsSchema.safeParse({ translationId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const existing = await db.newsTranslation.findUnique({
      where: { id: parsed.data.translationId },
      select: { publishedAt: true, newsId: true },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Actualité introuvable.");

    const translation = await db.newsTranslation.update({
      where: { id: parsed.data.translationId },
      data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.news);
    updateTag(TAGS.newsList(locale));
    updateTag(TAGS.newsItem(locale, translation.slug));
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "news.publish", entity: "News", entityId: existing.newsId, diff: { locale } });

    return null;
  });
}

export async function unpublishNewsAction(translationId: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = unpublishNewsSchema.safeParse({ translationId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const translation = await db.newsTranslation.update({
      where: { id: parsed.data.translationId },
      data: { status: "DRAFT" },
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.news);
    updateTag(TAGS.newsList(locale));
    updateTag(TAGS.newsItem(locale, translation.slug));
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: "news.unpublish",
      entity: "News",
      entityId: translation.newsId,
      diff: { locale },
    });

    return null;
  });
}

export async function deleteNewsAction(newsId: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteNewsSchema.safeParse({ newsId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const existing = await db.news.findUnique({
      where: { id: parsed.data.newsId },
      include: { translations: { select: { locale: true, slug: true } } },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Actualité introuvable.");

    // NewsMedia rows are ON DELETE CASCADE (schema) — the gallery join table
    // disappears with the news item, but MediaAsset rows themselves are
    // untouched (Task 05's own "deleting a news item leaves its MediaAsset
    // rows intact" requirement).
    await db.news.delete({ where: { id: parsed.data.newsId } });

    updateTag(TAGS.news);
    for (const t of existing.translations) {
      const locale = fromDbLocale(t.locale);
      updateTag(TAGS.newsList(locale));
      updateTag(TAGS.newsItem(locale, t.slug));
    }
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "news.delete", entity: "News", entityId: existing.id });

    return null;
  });
}

export async function getNewsForEditAction(
  id: string,
): Promise<ActionResult<Awaited<ReturnType<typeof getNewsForEdit>>>> {
  return runAction(async () => {
    await requireSession();
    return getNewsForEdit(id);
  });
}
