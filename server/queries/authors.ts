import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

// Small table (a handful of researchers), read in full everywhere it's
// needed — the admin list and the article form's author picker.
export async function listAuthors() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors);

  return db.author.findMany({
    orderBy: { name: "asc" },
    include: { photo: true, _count: { select: { articles: true } } },
  });
}

export async function getAuthorById(id: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors);

  return db.author.findUnique({ where: { id }, include: { photo: true } });
}

// Depends on ArticleAuthor rows, which only ever change alongside an
// article write — tagging both keeps this fresh without a dedicated tag.
export async function getAuthorArticleCount(id: string): Promise<number> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.authors, TAGS.articles);

  return db.articleAuthor.count({ where: { authorId: id } });
}
