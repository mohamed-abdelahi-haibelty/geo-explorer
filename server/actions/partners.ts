"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { ensureUniqueSlug } from "@/lib/slug";
import {
  createPartnerSchema,
  updatePartnerSchema,
  deletePartnerSchema,
  reorderPartnersSchema,
  togglePartnerPublishedSchema,
} from "@/lib/validation/partners";
import { Prisma } from "@/prisma/generated/client";
import type { Partner } from "@/prisma/generated/client";

// category_fr/category_en/category_ar — same flat-named-inputs convention
// authors.ts uses for title/bio, and the same reasoning: individually
// inspectable, no opaque JSON blob to parse.
function categoryFromFormData(formData: FormData): { fr: string; en?: string; ar?: string } | undefined {
  const fr = String(formData.get("category_fr") ?? "").trim();
  if (!fr) return undefined;
  const en = String(formData.get("category_en") ?? "").trim();
  const ar = String(formData.get("category_ar") ?? "").trim();
  return { fr, ...(en ? { en } : {}), ...(ar ? { ar } : {}) };
}

function fieldsFromFormData(formData: FormData) {
  return {
    name: formData.get("name") || undefined,
    slug: formData.get("slug") || undefined,
    websiteUrl: formData.get("websiteUrl") || undefined,
    category: categoryFromFormData(formData),
    logoId: formData.get("logoId") || undefined,
    published: formData.get("published") === "true",
  };
}

export async function createPartner(_prevState: ActionResult<Partner> | null, formData: FormData): Promise<ActionResult<Partner>> {
  return runAction(async () => {
    const parsed = createPartnerSchema.safeParse(fieldsFromFormData(formData));
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.slug || data.name, (candidate) =>
      db.partner.findUnique({ where: { slug: candidate }, select: { id: true } }).then((row) => row !== null),
    );
    const maxOrder = await db.partner.aggregate({ _max: { order: true } });

    const partner = await db.partner.create({
      data: {
        name: data.name,
        slug,
        websiteUrl: data.websiteUrl ?? null,
        category: data.category ? (data.category as Prisma.InputJsonValue) : Prisma.DbNull,
        logoId: data.logoId ?? null,
        published: data.published,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    updateTag(TAGS.partners);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "partner.create", entity: "Partner", entityId: partner.id });

    return partner;
  });
}

export async function updatePartner(_prevState: ActionResult<Partner> | null, formData: FormData): Promise<ActionResult<Partner>> {
  return runAction(async () => {
    const parsed = updatePartnerSchema.safeParse({ id: formData.get("id"), ...fieldsFromFormData(formData) });
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const slug = await ensureUniqueSlug(data.slug || data.name, (candidate) =>
      db.partner.findFirst({ where: { slug: candidate, NOT: { id: data.id } }, select: { id: true } }).then((row) => row !== null),
    );

    const partner = await db.partner.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug,
        websiteUrl: data.websiteUrl ?? null,
        category: data.category ? (data.category as Prisma.InputJsonValue) : Prisma.DbNull,
        logoId: data.logoId ?? null,
        published: data.published,
      },
    });

    updateTag(TAGS.partners);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "partner.update", entity: "Partner", entityId: partner.id });

    return partner;
  });
}

export async function deletePartner(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deletePartnerSchema.safeParse({ id });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const partner = await db.partner.delete({ where: { id: parsed.data.id } });

    updateTag(TAGS.partners);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "partner.delete", entity: "Partner", entityId: partner.id });

    return null;
  });
}

// Whole-list operation, not a per-row edit — no `updatedAt` check, same
// reasoning as reorderServicesAction.
export async function reorderPartnersAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = reorderPartnersSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    await db.$transaction(
      parsed.data.orderedIds.map((id, index) => db.partner.update({ where: { id }, data: { order: index } })),
    );

    updateTag(TAGS.partners);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: "partner.reorder", entity: "Partner" });

    return null;
  });
}

export async function togglePartnerPublishedAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = togglePartnerPublishedSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const partner = await db.partner.update({ where: { id: parsed.data.id }, data: { published: parsed.data.published } });

    updateTag(TAGS.partners);
    revalidatePath("/");
    await logAudit({
      userId: user.id,
      action: parsed.data.published ? "partner.publish" : "partner.unpublish",
      entity: "Partner",
      entityId: partner.id,
    });

    return null;
  });
}
