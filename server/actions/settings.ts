"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { updateSiteSettingSchema } from "@/lib/validation/settings";

type SavedSetting = { updatedAt: string };

// The only write path to SiteSetting — always upserts on the fixed `id: 1`,
// never a bare `create` with a client-supplied id, which is what makes a
// second row impossible through the UI. Conflict check is trivially
// scoped: there is exactly one row.
export async function updateSiteSettingAction(input: unknown): Promise<ActionResult<SavedSetting>> {
  return runAction(async () => {
    const parsed = updateSiteSettingSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Formulaire invalide.", zodFieldErrors(parsed.error));
    const user = await requireSession();
    const data = parsed.data;

    const existing = await db.siteSetting.findUnique({ where: { id: 1 } });
    if (existing && !data.force && data.updatedAt && existing.updatedAt.toISOString() !== data.updatedAt) {
      throw new AppError("CONFLICT", "Les paramètres ont été modifiés ailleurs depuis leur chargement.", {
        updatedAt: existing.updatedAt.toISOString(),
      });
    }

    const payload = {
      companyName: data.companyName,
      tagline: data.tagline || null,
      address: data.address || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      phones: data.phones,
      email: data.email || null,
      siteUrl: data.siteUrl || null,
      contactRecipients: data.contactRecipients,
      mapEmbedUrl: data.mapEmbedUrl || null,
      linkedin: data.linkedin || null,
      facebook: data.facebook || null,
      defaultOgImage: data.defaultOgImage || null,
      analyticsId: data.analyticsId || null,
    };

    const setting = await db.siteSetting.upsert({
      where: { id: 1 },
      create: { id: 1, ...payload },
      update: payload,
    });

    updateTag(TAGS.settings);
    revalidatePath("/");
    await logAudit({ userId: user.id, action: existing ? "settings.update" : "settings.create", entity: "SiteSetting", entityId: "1" });

    return { updatedAt: setting.updatedAt.toISOString() };
  });
}
