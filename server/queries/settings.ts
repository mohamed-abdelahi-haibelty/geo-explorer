import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

export async function getSiteSetting() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.settings);
  return db.siteSetting.findUnique({ where: { id: 1 } });
}
