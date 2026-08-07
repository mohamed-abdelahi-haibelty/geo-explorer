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

  // Counts translations (article×locale pairs), not articles — an article
  // published in FR and drafted in EN counts once in each tile, which is the
  // more useful number now that publish state is per locale (Task 04a).
  const [publishedArticles, draftArticles, newsCount, unreadMessages] = await Promise.all([
    db.articleTranslation.count({ where: { status: PublishStatus.PUBLISHED } }),
    db.articleTranslation.count({ where: { status: PublishStatus.DRAFT } }),
    db.news.count(),
    db.contactMessage.count({ where: { status: ContactStatus.NEW } }),
  ]);

  return { publishedArticles, draftArticles, newsCount, unreadMessages };
}
