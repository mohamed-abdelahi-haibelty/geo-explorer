"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { destroyAsset, fetchBlurDataUrl } from "@/server/services/cloudinary";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import {
  MEDIA_LIMITS,
  deleteMediaAssetSchema,
  deleteMediaAssetsSchema,
  mediaUsageBatchSchema,
  saveMediaAssetSchema,
  searchMediaSchema,
  updateMediaAssetSchema,
} from "@/lib/validation/media";
import { getMediaUsage, getMediaUsageBatch, listMedia, type MediaUsageItem } from "@/server/queries/media";
import type { MediaAsset } from "@/prisma/generated/client";

export async function saveMediaAsset(input: unknown): Promise<ActionResult<MediaAsset>> {
  return runAction(async () => {
    const parsed = saveMediaAssetSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("VALIDATION", "Fichier envoyé invalide.", { alt: parsed.error.issues[0]?.message ?? "" });
    }
    const data = parsed.data;
    const user = await requireSession();

    // The client validates before upload, but the file already reached
    // Cloudinary by the time this action runs — revalidate here and clean up
    // the remote asset rather than trust what the browser sent.
    const limits = MEDIA_LIMITS[data.resourceType];
    const formatOk = (limits.formats as readonly string[]).includes(data.format.toLowerCase());
    const sizeOk = data.bytes <= limits.maxBytes;
    const durationOk =
      data.resourceType !== "video" ||
      !data.duration ||
      data.duration <= MEDIA_LIMITS.video.maxDurationSeconds;

    if (!formatOk || !sizeOk || !durationOk) {
      await destroyAsset(data.publicId, data.resourceType);
      throw new AppError("UPLOAD_REJECTED", "Le fichier dépasse les limites autorisées et a été refusé.");
    }

    const blurDataUrl = data.resourceType === "image" ? await fetchBlurDataUrl(data.publicId) : null;

    const asset = await db.mediaAsset.create({
      data: {
        publicId: data.publicId,
        type: data.type,
        format: data.format,
        url: data.url,
        width: data.width,
        height: data.height,
        duration: data.duration,
        bytes: data.bytes,
        blurDataUrl,
        alt: data.alt || null,
        caption: data.caption || null,
        folder: data.folder,
        originalFilename: data.originalFilename,
        uploadedById: user.id,
      },
    });

    updateTag(TAGS.media);
    await logAudit({ userId: user.id, action: "media.upload", entity: "MediaAsset", entityId: asset.id });

    return asset;
  });
}

export async function updateMediaAsset(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = updateMediaAssetSchema.safeParse({
      id: formData.get("id"),
      alt: formData.get("alt") || undefined,
      caption: formData.get("caption") || undefined,
    });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "Formulaire invalide.");
    }
    const user = await requireSession();

    const existing = await db.mediaAsset.findUnique({ where: { id: parsed.data.id }, select: { type: true } });
    if (!existing) throw new AppError("NOT_FOUND", "Média introuvable.");
    if (existing.type === "IMAGE" && !parsed.data.alt) {
      throw new AppError("VALIDATION", "Le texte alternatif est obligatoire pour une image.", {
        alt: "Le texte alternatif est obligatoire pour une image.",
      });
    }

    await db.mediaAsset.update({
      where: { id: parsed.data.id },
      data: { alt: parsed.data.alt || null, caption: parsed.data.caption || null },
    });

    updateTag(TAGS.media);
    await logAudit({ userId: user.id, action: "media.update", entity: "MediaAsset", entityId: parsed.data.id });

    return null;
  });
}

async function destroyMediaAssetRow(id: string, userId: string) {
  const asset = await db.mediaAsset.findUnique({
    where: { id },
    select: { id: true, publicId: true, type: true },
  });
  if (!asset) throw new AppError("NOT_FOUND", "Média introuvable.");

  // Cloudinary delete degrades independently of the DB row (error-handling.md):
  // the row is removed either way, an orphaned remote asset is only logged.
  await destroyAsset(asset.publicId, asset.type.toLowerCase() as "image" | "video" | "raw");
  // FK relations to this asset (cover, hero, logo, photo, gallery) are all
  // ON DELETE SET NULL / CASCADE in the schema — no manual nulling needed.
  await db.mediaAsset.delete({ where: { id: asset.id } });

  await logAudit({ userId, action: "media.delete", entity: "MediaAsset", entityId: asset.id });
}

export async function deleteMediaAsset(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteMediaAssetSchema.safeParse({ id });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    await destroyMediaAssetRow(parsed.data.id, user.id);

    updateTag(TAGS.media);
    return null;
  });
}

export async function deleteMediaAssetsAction(ids: string[]): Promise<ActionResult<{ deleted: number }>> {
  return runAction(async () => {
    const parsed = deleteMediaAssetsSchema.safeParse({ ids });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    for (const id of parsed.data.ids) {
      await destroyMediaAssetRow(id, user.id);
    }

    updateTag(TAGS.media);
    return { deleted: parsed.data.ids.length };
  });
}

export async function getMediaUsageAction(id: string): Promise<ActionResult<MediaUsageItem[]>> {
  return runAction(async () => {
    await requireSession();
    return getMediaUsage(id);
  });
}

export async function getMediaUsageBatchAction(ids: string[]): Promise<ActionResult<MediaUsageItem[]>> {
  return runAction(async () => {
    const parsed = mediaUsageBatchSchema.safeParse({ ids });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    await requireSession();
    return getMediaUsageBatch(parsed.data.ids);
  });
}

export async function searchMediaAction(input: unknown): Promise<ActionResult<Awaited<ReturnType<typeof listMedia>>>> {
  return runAction(async () => {
    await requireSession();
    const parsed = searchMediaSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête de recherche invalide.");
    return listMedia(parsed.data);
  });
}
