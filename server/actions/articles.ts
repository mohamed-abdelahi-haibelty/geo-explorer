"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { processContent } from "@/server/services/content";
import { signPreviewToken } from "@/server/services/preview-token";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { ensureUniqueSlug } from "@/lib/slug";
import { toDbLocale, fromDbLocale } from "@/lib/locale";
import {
  createArticleSchema,
  createArticleTranslationSchema,
  deleteArticleSchema,
  publishArticleSchema,
  unpublishArticleSchema,
  updateArticleSchema,
} from "@/lib/validation/articles";
import { getArticleForEdit } from "@/server/queries/articles";
import { Prisma } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

type SavedTranslation = {
  articleId: string;
  translationId: string;
  locale: LocaleCode;
  slug: string;
  updatedAt: string;
  status: string;
};

// "Select existing or create by name" — a name that already exists on the
// Tag table is reused, everything else becomes a new row. `name` is
// locale-keyed JSON; the admin always works in French here (see
// tag-picker.tsx).
async function resolveTagIds(tagNames: string[]): Promise<string[]> {
  const uniqueNames = Array.from(new Set(tagNames.map((name) => name.trim()).filter(Boolean)));
  const ids: string[] = [];
  for (const name of uniqueNames) {
    const existing = await db.tag.findFirst({
      where: { name: { path: ["fr"], equals: name } },
      select: { id: true },
    });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const slug = await ensureUniqueSlug(name, (candidate) =>
      db.tag.findUnique({ where: { slug: candidate }, select: { id: true } }).then((row) => row !== null),
    );
    const created = await db.tag.create({ data: { name: { fr: name }, slug } });
    ids.push(created.id);
  }
  return ids;
}

// Brand-new article: parent (locale-independent fields) + its first
// translation, in one transaction.
export async function createArticleAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = createArticleSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;
    const dbLocale = toDbLocale(data.locale);

    const slug = await ensureUniqueSlug(data.slug || data.title, (candidate) =>
      db.articleTranslation
        .findFirst({ where: { locale: dbLocale, slug: candidate }, select: { id: true } })
        .then((row) => row !== null),
    );
    const pipeline = processContent(data.contentJson, data.excerpt);
    const tagIds = await resolveTagIds(data.tagNames);

    const article = await db.article.create({
      data: {
        coverId: data.coverId ?? null,
        pdfUrl: data.pdfUrl ?? null,
        pdfBytes: data.pdfBytes ?? null,
        featured: data.featured,
        createdById: user.id,
        authors: { create: data.authorIds.map((authorId, index) => ({ authorId, position: index })) },
        tags: { create: tagIds.map((tagId) => ({ tagId })) },
        translations: {
          create: {
            locale: dbLocale,
            slug,
            title: data.title,
            subtitle: data.subtitle || null,
            excerpt: pipeline.excerpt || null,
            contentJson: data.contentJson as Prisma.InputJsonValue,
            contentHtml: pipeline.contentHtml,
            plainText: pipeline.plainText,
            readingTime: pipeline.readingTime,
            metaTitle: data.metaTitle || null,
            metaDescription: data.metaDescription || null,
          },
        },
      },
      include: { translations: true },
    });
    const translation = article.translations[0];

    updateTag(TAGS.articles);
    await logAudit({ userId: user.id, action: "article.create", entity: "Article", entityId: article.id });

    return {
      articleId: article.id,
      translationId: translation.id,
      locale: data.locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

// Fills a previously-empty locale tab on an existing article. Shared fields
// (cover/pdf/authors/tags/featured) are re-written on the parent here too —
// the form always submits their current state regardless of which tab is
// being saved.
export async function createArticleTranslationAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = createArticleTranslationSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;
    const dbLocale = toDbLocale(data.locale);

    const existingArticle = await db.article.findUnique({ where: { id: data.articleId }, select: { id: true } });
    if (!existingArticle) throw new AppError("NOT_FOUND", "Article introuvable.");

    const existingTranslation = await db.articleTranslation.findUnique({
      where: { articleId_locale: { articleId: data.articleId, locale: dbLocale } },
      select: { id: true },
    });
    if (existingTranslation) throw new AppError("CONFLICT", "Cette langue existe déjà pour cet article.");

    const slug = await ensureUniqueSlug(data.slug || data.title, (candidate) =>
      db.articleTranslation
        .findFirst({ where: { locale: dbLocale, slug: candidate }, select: { id: true } })
        .then((row) => row !== null),
    );
    const pipeline = processContent(data.contentJson, data.excerpt);
    const tagIds = await resolveTagIds(data.tagNames);

    const translation = await db.$transaction(async (tx) => {
      await tx.articleAuthor.deleteMany({ where: { articleId: data.articleId } });
      await tx.articleTag.deleteMany({ where: { articleId: data.articleId } });
      await tx.article.update({
        where: { id: data.articleId },
        data: {
          coverId: data.coverId ?? null,
          pdfUrl: data.pdfUrl ?? null,
          pdfBytes: data.pdfBytes ?? null,
          featured: data.featured,
          authors: { create: data.authorIds.map((authorId, index) => ({ authorId, position: index })) },
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      });
      return tx.articleTranslation.create({
        data: {
          articleId: data.articleId,
          locale: dbLocale,
          slug,
          title: data.title,
          subtitle: data.subtitle || null,
          excerpt: pipeline.excerpt || null,
          contentJson: data.contentJson as Prisma.InputJsonValue,
          contentHtml: pipeline.contentHtml,
          plainText: pipeline.plainText,
          readingTime: pipeline.readingTime,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    updateTag(TAGS.articles);
    await logAudit({
      userId: user.id,
      action: "article.translation.create",
      entity: "Article",
      entityId: data.articleId,
      diff: { locale: data.locale },
    });

    return {
      articleId: data.articleId,
      translationId: translation.id,
      locale: data.locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

export async function updateArticleAction(input: unknown): Promise<ActionResult<SavedTranslation>> {
  return runAction(async () => {
    const parsed = updateArticleSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const existing = await db.articleTranslation.findUnique({
      where: { id: data.translationId },
      select: { id: true, articleId: true, locale: true, updatedAt: true, publishedAt: true, slug: true },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Article introuvable.");

    // Concurrent-edit guard, scoped to the translation row: the stored row
    // moved on since this client last loaded it and the caller didn't
    // explicitly choose to overwrite — refuse the write. The newer
    // timestamp rides in `fields` so the UI can offer "reload" without a
    // second round trip.
    if (!data.force && existing.updatedAt.toISOString() !== data.updatedAt) {
      throw new AppError("CONFLICT", "Cet article a été modifié ailleurs depuis son chargement.", {
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
          db.articleTranslation
            .findFirst({
              where: { locale: existing.locale, slug: candidate, NOT: { id: data.translationId } },
              select: { id: true },
            })
            .then((row) => row !== null),
        )
      : existing.slug;

    const pipeline = processContent(data.contentJson, data.excerpt);
    const tagIds = await resolveTagIds(data.tagNames);

    const translation = await db.$transaction(async (tx) => {
      await tx.articleAuthor.deleteMany({ where: { articleId: existing.articleId } });
      await tx.articleTag.deleteMany({ where: { articleId: existing.articleId } });
      // Bumps the parent's bookkeeping `updatedAt` as a side effect (@updatedAt)
      // — "any-locale last-touched", used only for the admin list's sort order,
      // never for the conflict check above (that's the translation's own row).
      await tx.article.update({
        where: { id: existing.articleId },
        data: {
          coverId: data.coverId ?? null,
          pdfUrl: data.pdfUrl ?? null,
          pdfBytes: data.pdfBytes ?? null,
          featured: data.featured,
          authors: { create: data.authorIds.map((authorId, index) => ({ authorId, position: index })) },
          tags: { create: tagIds.map((tagId) => ({ tagId })) },
        },
      });
      return tx.articleTranslation.update({
        where: { id: data.translationId },
        data: {
          slug,
          title: data.title,
          subtitle: data.subtitle || null,
          excerpt: pipeline.excerpt || null,
          contentJson: data.contentJson as Prisma.InputJsonValue,
          contentHtml: pipeline.contentHtml,
          plainText: pipeline.plainText,
          readingTime: pipeline.readingTime,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.articles);
    updateTag(TAGS.articleList(locale));
    updateTag(TAGS.article(locale, translation.slug));
    await logAudit({
      userId: user.id,
      action: "article.update",
      entity: "Article",
      entityId: existing.articleId,
      diff: { locale },
    });

    return {
      articleId: existing.articleId,
      translationId: translation.id,
      locale,
      slug: translation.slug,
      updatedAt: translation.updatedAt.toISOString(),
      status: translation.status,
    };
  });
}

export async function publishArticleAction(translationId: string): Promise<ActionResult<{ updatedAt: string }>> {
  return runAction(async () => {
    const parsed = publishArticleSchema.safeParse({ translationId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const existing = await db.articleTranslation.findUnique({
      where: { id: parsed.data.translationId },
      select: { publishedAt: true, articleId: true },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Article introuvable.");

    const translation = await db.articleTranslation.update({
      where: { id: parsed.data.translationId },
      data: { status: "PUBLISHED", publishedAt: existing.publishedAt ?? new Date() },
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.articles);
    updateTag(TAGS.articleList(locale));
    updateTag(TAGS.article(locale, translation.slug));
    await logAudit({
      userId: user.id,
      action: "article.publish",
      entity: "Article",
      entityId: existing.articleId,
      diff: { locale },
    });

    // The publish/unpublish write bumps `updatedAt` (Prisma @updatedAt), so
    // the caller's copy is now stale. Returning the new value lets the form
    // refresh its optimistic-concurrency token — without it the very next
    // autosave compared an old timestamp against the row this same client
    // had just written and reported a bogus "modifiée ailleurs" conflict.
    return { updatedAt: translation.updatedAt.toISOString() };
  });
}

export async function unpublishArticleAction(translationId: string): Promise<ActionResult<{ updatedAt: string }>> {
  return runAction(async () => {
    const parsed = unpublishArticleSchema.safeParse({ translationId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const translation = await db.articleTranslation.update({
      where: { id: parsed.data.translationId },
      data: { status: "DRAFT" },
    });

    const locale = fromDbLocale(translation.locale);
    updateTag(TAGS.articles);
    updateTag(TAGS.articleList(locale));
    updateTag(TAGS.article(locale, translation.slug));
    await logAudit({
      userId: user.id,
      action: "article.unpublish",
      entity: "Article",
      entityId: translation.articleId,
      diff: { locale },
    });

    // The publish/unpublish write bumps `updatedAt` (Prisma @updatedAt), so
    // the caller's copy is now stale. Returning the new value lets the form
    // refresh its optimistic-concurrency token — without it the very next
    // autosave compared an old timestamp against the row this same client
    // had just written and reported a bogus "modifiée ailleurs" conflict.
    return { updatedAt: translation.updatedAt.toISOString() };
  });
}

export async function deleteArticleAction(articleId: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteArticleSchema.safeParse({ articleId });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const existing = await db.article.findUnique({
      where: { id: parsed.data.articleId },
      include: { translations: { select: { locale: true, slug: true } } },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Article introuvable.");

    await db.article.delete({ where: { id: parsed.data.articleId } });

    updateTag(TAGS.articles);
    for (const t of existing.translations) {
      const locale = fromDbLocale(t.locale);
      updateTag(TAGS.articleList(locale));
      updateTag(TAGS.article(locale, t.slug));
    }
    await logAudit({ userId: user.id, action: "article.delete", entity: "Article", entityId: existing.id });

    return null;
  });
}

export async function getArticleForEditAction(
  id: string,
): Promise<ActionResult<Awaited<ReturnType<typeof getArticleForEdit>>>> {
  return runAction(async () => {
    await requireSession();
    return getArticleForEdit(id);
  });
}

export async function createArticlePreviewLinkAction(translationId: string): Promise<ActionResult<{ url: string }>> {
  return runAction(async () => {
    await requireSession();
    const translation = await db.articleTranslation.findUnique({
      where: { id: translationId },
      select: { articleId: true, locale: true },
    });
    if (!translation) throw new AppError("NOT_FOUND", "Article introuvable.");

    const token = signPreviewToken({
      id: translation.articleId,
      type: "article",
      locale: fromDbLocale(translation.locale),
    });
    return { url: `/apercu/${token}` };
  });
}
