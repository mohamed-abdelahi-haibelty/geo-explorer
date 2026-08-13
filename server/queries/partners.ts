import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

export async function listPartnersAdmin() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.partners);

  return db.partner.findMany({ orderBy: { order: "asc" }, include: { logo: true } });
}

// Public partner band. `Partner` has zero rows until the client delivers
// real names/logos (do not invent any in the meantime); an empty array here
// is exactly what lets the band render nothing at all rather than a
// placeholder container.
export async function listPartnersPublic() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.partners);

  return db.partner.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      category: true,
      logo: { select: { publicId: true, blurDataUrl: true, alt: true } },
    },
  });
}
