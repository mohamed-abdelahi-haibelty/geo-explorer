"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { toDbLocale } from "@/lib/locale";
import { ensureUniqueSlug } from "@/lib/slug";
import {
  updateServiceSchema,
  reorderServicesSchema,
  toggleServicePublishedSchema,
  createServiceSchema,
  deleteServiceSchema,
} from "@/lib/validation/services";
import { Prisma } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

type SavedService = { serviceId: string; translationId: string; locale: LocaleCode; updatedAt: string };

// Not one of the original five fixed lines (this list was originally
// edit-only) — the client can now grow it. A bare FR-titled row, appended
// to the end of the list and unpublished by default (same reasoning as
// Article/News defaulting to DRAFT: a service with no blocks yet shouldn't
// be able to appear on the public site before it has content). Everything
// else is filled on the edit page updateServiceAction already covers.
export async function createServiceAction(input: unknown): Promise<ActionResult<{ serviceId: string }>> {
  return runAction(async () => {
    const parsed = createServiceSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.title, (candidate) =>
      db.service.findUnique({ where: { slug: candidate }, select: { id: true } }).then((row) => row !== null),
    );
    const maxOrder = await db.service.aggregate({ _max: { order: true } });

    const service = await db.service.create({
      data: {
        slug,
        published: false,
        order: (maxOrder._max.order ?? -1) + 1,
        translations: { create: { locale: "FR", title: data.title } },
      },
    });

    updateTag(TAGS.services);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "service.create", entity: "Service", entityId: service.id });

    return { serviceId: service.id };
  });
}

// No reference-count guard (unlike deleteAuthor) — nothing else has an FK
// to Service; translations/blocks cascade via the schema's own
// onDelete: Cascade.
export async function deleteServiceAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteServiceSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const service = await db.service.delete({
      where: { id: parsed.data.serviceId },
      include: { translations: { select: { locale: true } } },
    });

    updateTag(TAGS.services);
    for (const t of service.translations) {
      updateTag(TAGS.service(t.locale.toLowerCase() as LocaleCode, service.slug));
    }
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "service.delete", entity: "Service", entityId: service.id });

    return null;
  });
}

// Locale-independent fields (icon/hero/published) + one locale's translation
// + the full blocks array, saved together (shared fields are resubmitted on
// every translation save). Blocks are reconciled by id
// — update existing, create new-from-temp-id, delete removed — deliberately
// not the seed's delete-and-recreate: the admin form's drag-and-drop keys
// need stable ids to survive a save, which the seed (no client state to
// preserve across runs) never had to care about.
export async function updateServiceAction(input: unknown): Promise<ActionResult<SavedService>> {
  return runAction(async () => {
    const parsed = updateServiceSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;
    const dbLocale = toDbLocale(data.locale);

    const existing = await db.service.findUnique({
      where: { id: data.serviceId },
      include: { translations: true, blocks: true },
    });
    if (!existing) throw new AppError("NOT_FOUND", "Service introuvable.");

    const existingTranslation = existing.translations.find((t) => t.locale === dbLocale) ?? null;

    // Concurrent-edit guard, scoped to the translation row being written —
    // same shape as updateNewsAction/updateArticleAction. No row exists yet
    // when filling a previously-empty locale tab, so there's nothing to
    // conflict with.
    if (existingTranslation && !data.force && data.updatedAt && existingTranslation.updatedAt.toISOString() !== data.updatedAt) {
      throw new AppError("CONFLICT", "Ce service a été modifié ailleurs depuis son chargement.", {
        updatedAt: existingTranslation.updatedAt.toISOString(),
      });
    }

    const keptIds = new Set(data.blocks.filter((b) => b.id).map((b) => b.id!));
    const existingIds = new Set(existing.blocks.map((b) => b.id));

    const translation = await db.$transaction(async (tx) => {
      await tx.service.update({
        where: { id: data.serviceId },
        data: {
          icon: data.icon ?? null,
          heroId: data.heroId ?? null,
          published: data.published,
        },
      });

      const removedIds = existing.blocks.filter((b) => !keptIds.has(b.id)).map((b) => b.id);
      if (removedIds.length > 0) {
        await tx.serviceBlock.deleteMany({ where: { id: { in: removedIds } } });
      }

      await Promise.all(
        data.blocks.map((block, index) => {
          const payload = {
            title: block.title as Prisma.InputJsonValue,
            items: block.items as Prisma.InputJsonValue,
            order: index,
          };
          if (block.id && existingIds.has(block.id)) {
            return tx.serviceBlock.update({ where: { id: block.id }, data: payload });
          }
          return tx.serviceBlock.create({ data: { ...payload, serviceId: data.serviceId } });
        }),
      );

      return tx.serviceTranslation.upsert({
        where: { serviceId_locale: { serviceId: data.serviceId, locale: dbLocale } },
        create: {
          serviceId: data.serviceId,
          locale: dbLocale,
          title: data.title,
          tagline: data.tagline || null,
          summary: data.summary || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
        update: {
          title: data.title,
          tagline: data.tagline || null,
          summary: data.summary || null,
          metaTitle: data.metaTitle || null,
          metaDescription: data.metaDescription || null,
        },
      });
    });

    updateTag(TAGS.services);
    updateTag(TAGS.service(data.locale, existing.slug));
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: existingTranslation ? "service.update" : "service.translation.create",
      entity: "Service",
      entityId: data.serviceId,
      diff: { locale: data.locale },
    });

    return {
      serviceId: data.serviceId,
      translationId: translation.id,
      locale: data.locale,
      updatedAt: translation.updatedAt.toISOString(),
    };
  });
}

// Writes every service's `order` = its position in the submitted array, in
// one transaction. No `updatedAt` check — order is a whole-list operation on
// a single-admin system, not a per-row edit that can race another editor's
// per-row edit (the conflict check only applies to page sections, service
// translations and settings).
export async function reorderServicesAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = reorderServicesSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    await db.$transaction(
      parsed.data.orderedIds.map((id, index) => db.service.update({ where: { id }, data: { order: index } })),
    );

    updateTag(TAGS.services);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "service.reorder", entity: "Service" });

    return null;
  });
}

export async function toggleServicePublishedAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = toggleServicePublishedSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const service = await db.service.update({
      where: { id: parsed.data.serviceId },
      data: { published: parsed.data.published },
      include: { translations: { select: { locale: true } } },
    });

    updateTag(TAGS.services);
    // Every locale's tag, deliberately: `published` is a single flat column
    // on the parent (not per-translation), so flipping it changes every
    // locale's public visibility at once — unlike a translation content
    // edit, this isn't the "saving Arabic must leave French's tag alone"
    // case that a per-locale guard would need to protect.
    for (const t of service.translations) {
      updateTag(TAGS.service(t.locale.toLowerCase() as LocaleCode, service.slug));
    }
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: parsed.data.published ? "service.publish" : "service.unpublish",
      entity: "Service",
      entityId: service.id,
    });

    return null;
  });
}
