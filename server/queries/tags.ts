import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

// No dedicated admin route — Tag rows are only ever browsed and created
// inline from the article form's tag picker (Task 04 step 4). `name` is
// locale-keyed JSON (Task 04a) — can't be ordered by in SQL, so this
// returns slug order and callers sort by their active locale's picked text
// (lib/locale.ts's pickLocalizedText) once they know which locale that is.
export async function listTags() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  return db.tag.findMany({ orderBy: { slug: "asc" }, select: { id: true, name: true, slug: true } });
}

// Depends on ArticleTag rows, which only ever change alongside an article
// write — tagging both keeps this fresh without a dedicated tag, same
// reasoning as authors.ts's getAuthorArticleCount.
export async function getTagArticleCount(id: string): Promise<number> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);

  return db.articleTag.count({ where: { tagId: id } });
}
