import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { PublishStatus, ContactStatus } from "@/prisma/generated/client";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";

export async function getDashboardCounts() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.articles);
  cacheTag(TAGS.news);
  cacheTag(TAGS.messages);

  const [publishedArticles, draftArticles, newsCount, unreadMessages] = await Promise.all([
    db.article.count({ where: { status: PublishStatus.PUBLISHED } }),
    db.article.count({ where: { status: PublishStatus.DRAFT } }),
    db.news.count(),
    db.contactMessage.count({ where: { status: ContactStatus.NEW } }),
  ]);

  return { publishedArticles, draftArticles, newsCount, unreadMessages };
}
