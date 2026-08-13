"use server";

import { db } from "@/server/db";

// Fire-and-forget view counting — Article.viewCount is the
// only viewCount column the schema carries (News has none), so this only
// ever touches Article. Called un-awaited from a client island on mount
// (components/site/view-counter.tsx) so a slow write never blocks paint,
// and deliberately never calls updateTag()/revalidatePath(): busting the
// "use cache" reads that serve the article page on every single view would
// make the route effectively dynamic, which is exactly what this must not
// do. The count is read back on the admin side only, where "use cache"'s
// hours-long staleness is an acceptable trade for never invalidating here.
export async function incrementArticleViewCount(articleId: string): Promise<void> {
  await db.article.update({ where: { id: articleId }, data: { viewCount: { increment: 1 } } }).catch(() => {});
}
