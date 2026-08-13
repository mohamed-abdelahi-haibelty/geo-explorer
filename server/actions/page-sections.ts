"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { toDbLocale } from "@/lib/locale";
import { saveSectionSchema } from "@/lib/validation/page-sections";
import { getSectionSchema } from "@/lib/validation/sections";
import { Prisma } from "@/prisma/generated/client";
import type { PageKey } from "@/prisma/generated/client";

type SavedSection = { id: string; page: PageKey; key: string; updatedAt: string };

// One row per (page, key, locale) — the unique triple pins the conflict
// check to exactly the row being written, no id lookup needed. Saving one
// locale's row never touches another locale's tag: a single updateTag
// call, never a loop over LOCALES.
export async function saveSectionAction(input: unknown): Promise<ActionResult<SavedSection>> {
  return runAction(async () => {
    const parsed = saveSectionSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const envelope = parsed.data;

    const sectionSchema = getSectionSchema(envelope.page, envelope.key);
    if (!sectionSchema) throw new AppError("NOT_FOUND", "Section inconnue.");

    const dataParsed = sectionSchema.safeParse(envelope.data);
    if (!dataParsed.success) {
      throw new AppError("VALIDATION", "Le contenu de la section est invalide.", zodFieldErrors(dataParsed.error));
    }

    const dbLocale = toDbLocale(envelope.locale);
    const existing = await db.pageSection.findUnique({
      where: { page_key_locale: { page: envelope.page, key: envelope.key, locale: dbLocale } },
    });

    if (existing && !envelope.force && envelope.updatedAt && existing.updatedAt.toISOString() !== envelope.updatedAt) {
      throw new AppError("CONFLICT", "Cette section a été modifiée ailleurs depuis son chargement.", {
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    // A brand-new locale row (filling a previously-empty EN/AR tab) inherits
    // its position from any sibling row for the same key — `order` isn't
    // exposed to this form, only set once at seed time (this form scopes to
    // section content, not page-level section ordering).
    const order =
      existing?.order ??
      (await db.pageSection.findFirst({ where: { page: envelope.page, key: envelope.key }, select: { order: true } }))
        ?.order ??
      0;

    const row = await db.pageSection.upsert({
      where: { page_key_locale: { page: envelope.page, key: envelope.key, locale: dbLocale } },
      create: {
        page: envelope.page,
        key: envelope.key,
        locale: dbLocale,
        data: dataParsed.data as Prisma.InputJsonValue,
        order,
        published: envelope.published,
        updatedById: user.id,
      },
      update: {
        data: dataParsed.data as Prisma.InputJsonValue,
        published: envelope.published,
        updatedById: user.id,
      },
    });

    updateTag(TAGS.page(envelope.locale, `${envelope.page}:${envelope.key}`));
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: existing ? "page-section.update" : "page-section.create",
      entity: "PageSection",
      entityId: row.id,
      diff: { page: envelope.page, key: envelope.key, locale: envelope.locale },
    });

    return { id: row.id, page: row.page, key: row.key, updatedAt: row.updatedAt.toISOString() };
  });
}
