"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import { deleteTagSchema } from "@/lib/validation/tags";
import { getTagArticleCount } from "@/server/queries/tags";

// Unlike authors, deletion is allowed even when a tag is still in use —
// tags are lightweight labels, not load-bearing attribution — but the
// caller (tag-picker.tsx) shows the affected-article count first so the
// admin isn't surprised by an ArticleTag cascade across other articles.
export async function deleteTagAction(id: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = deleteTagSchema.safeParse({ id });
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const tag = await db.tag.delete({ where: { id: parsed.data.id } });

    updateTag(TAGS.articles);
    await logAudit({ userId: user.id, action: "tag.delete", entity: "Tag", entityId: tag.id });

    return null;
  });
}

export async function getTagArticleCountAction(id: string): Promise<ActionResult<number>> {
  return runAction(async () => {
    await requireSession();
    return getTagArticleCount(id);
  });
}
