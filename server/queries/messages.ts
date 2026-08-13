import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { MESSAGES_PAGE_SIZE } from "@/lib/validation/contact";
import type { ContactStatus, Prisma } from "@/prisma/generated/client";

// Admin inbox read — "use cache" + TAGS.messages, same convention as every
// other admin list (listNewsAdmin, listPartnersAdmin…): mutations
// (updateContactStatusAction, submitContact) call updateTag(TAGS.messages)
// so this and getDashboardCounts' unread tile invalidate together.
export async function listMessagesAdmin({
  status,
  page,
}: {
  status?: ContactStatus;
  page: number;
}) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.messages);

  const where: Prisma.ContactMessageWhereInput = status ? { status } : {};

  const [items, total] = await Promise.all([
    db.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * MESSAGES_PAGE_SIZE,
      take: MESSAGES_PAGE_SIZE,
    }),
    db.contactMessage.count({ where }),
  ]);

  return { items, total, page, pageCount: Math.max(1, Math.ceil(total / MESSAGES_PAGE_SIZE)) };
}

// CSV export reads the full matching set, uncached and unpaginated — a
// point-in-time snapshot of "the current filter," not the paginated list.
export async function listMessagesForExport(status?: ContactStatus) {
  return db.contactMessage.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
  });
}
