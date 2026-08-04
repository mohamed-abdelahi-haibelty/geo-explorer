import { db } from "@/server/db";
import type { Prisma } from "@/prisma/generated/client";

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: Prisma.InputJsonValue;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        diff: entry.diff,
      },
    });
  } catch (error) {
    // Never block the response on an audit failure — log and move on.
    console.error(
      JSON.stringify({ level: "error", event: "audit_log_failed", action: entry.action, entity: entry.entity }),
      error,
    );
  }
}
