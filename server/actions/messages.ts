"use server";

import { updateTag } from "next/cache";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, type ActionResult } from "@/lib/errors";
import { updateContactStatusSchema } from "@/lib/validation/contact";
import type { ContactMessage } from "@/prisma/generated/client";

export async function updateContactStatusAction(input: unknown): Promise<ActionResult<ContactMessage>> {
  return runAction(async () => {
    const parsed = updateContactStatusSchema.safeParse(input);
    if (!parsed.success) throw new AppError("VALIDATION", "Requête invalide.");
    const user = await requireSession();

    const message = await db.contactMessage.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    updateTag(TAGS.messages);
    await logAudit({
      userId: user.id,
      action: "message.status",
      entity: "ContactMessage",
      entityId: message.id,
      diff: { status: parsed.data.status },
    });

    return message;
  });
}
