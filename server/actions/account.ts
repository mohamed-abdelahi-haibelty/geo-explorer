"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/server/auth";
import { requireSession } from "@/server/actions/_guard";
import { logAudit } from "@/server/services/audit";
import { db } from "@/server/db";
import { AppError, runAction, type ActionResult } from "@/lib/errors";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mot de passe actuel requis."),
    newPassword: z.string().min(12, "12 caractères minimum."),
    confirmPassword: z.string().min(1, "Confirmation requise."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export async function changePassword(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fields[key]) fields[key] = issue.message;
      }
      throw new AppError("VALIDATION", "Formulaire invalide.", fields);
    }

    const user = await requireSession();
    const requestHeaders = await headers();

    try {
      await auth.api.changePassword({
        headers: requestHeaders,
        body: {
          currentPassword: parsed.data.currentPassword,
          newPassword: parsed.data.newPassword,
        },
      });
    } catch {
      throw new AppError("VALIDATION", "Mot de passe actuel incorrect.", {
        currentPassword: "Mot de passe actuel incorrect.",
      });
    }

    await db.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
    await logAudit({ userId: user.id, action: "account.password_change", entity: "User", entityId: user.id });

    return null;
  });
}

const revokeSessionSchema = z.object({ token: z.string().min(1) });

export async function revokeSession(formData: FormData): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = revokeSessionSchema.safeParse({ token: formData.get("token") });
    if (!parsed.success) {
      throw new AppError("VALIDATION", "Requête invalide.");
    }

    const user = await requireSession();
    const requestHeaders = await headers();

    await auth.api.revokeSession({ headers: requestHeaders, body: { token: parsed.data.token } });
    await logAudit({ userId: user.id, action: "account.session_revoke", entity: "Session", entityId: parsed.data.token });

    return null;
  });
}

// Plain <form action> bindings require a void-returning function; the result
// (already logged by runAction on failure) isn't consumed here.
export async function revokeSessionForm(formData: FormData): Promise<void> {
  await revokeSession(formData);
}
