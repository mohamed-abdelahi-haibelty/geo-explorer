import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

export async function getSiteSetting() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.settings);
  return db.siteSetting.findUnique({ where: { id: 1 } });
}

// Root layout's default `openGraph.images` — resolves `defaultOgImage` (a
// MediaAsset id, not a Cloudinary publicId) to the publicId a URL can
// actually be built from, same indirection as `getSiteSettingForEdit` below.
export async function getDefaultOgImagePublicId() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.settings, TAGS.media);

  const setting = await db.siteSetting.findUnique({ where: { id: 1 }, select: { defaultOgImage: true } });
  if (!setting?.defaultOgImage) return null;
  const asset = await db.mediaAsset.findUnique({ where: { id: setting.defaultOgImage }, select: { publicId: true } });
  return asset?.publicId ?? null;
}

// Admin-only: `defaultOgImage` is a plain string column, not a MediaAsset
// relation (schema.prisma) — resolved separately here so the settings form
// can render a thumbnail for whatever's currently set.
export async function getSiteSettingForEdit() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.settings);

  const setting = await db.siteSetting.findUnique({ where: { id: 1 } });
  const ogImage = setting?.defaultOgImage
    ? await db.mediaAsset.findUnique({
        where: { id: setting.defaultOgImage },
        select: { id: true, publicId: true, blurDataUrl: true },
      })
    : null;

  return { setting, ogImage };
}
