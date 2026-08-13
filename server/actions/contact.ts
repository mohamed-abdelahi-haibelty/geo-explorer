"use server";

import { headers } from "next/headers";
import { updateTag } from "next/cache";
import { db } from "@/server/db";
import { ContactStatus } from "@/prisma/generated/client";
import { contactLimiter } from "@/server/services/ratelimit";
import { sendContactNotification } from "@/server/services/email";
import { getSiteSetting } from "@/server/queries/settings";
import { hashIp } from "@/lib/hash-ip";
import { toDbLocale } from "@/lib/locale";
import { TAGS } from "@/lib/cache-tags";
import { AppError, runAction, zodFieldErrors, type ActionResult } from "@/lib/errors";
import { submitContactSchema, type SubmitContactInput } from "@/lib/validation/contact";

const RATE_LIMITED_ERROR = "Trop de demandes envoyées récemment. Réessayez dans quelques instants.";
const SPAM_TIMING_MS = 3000;

// Strict order: zod parse -> honeypot -> timing -> contactLimiter (fail
// open) -> ContactMessage.create -> Resend send -> emailSent/emailError
// update -> updateTag. Honeypot and timing failures never surface
// differently from a real success (security-sensitive messaging) — they're
// stored as ContactStatus.SPAM and never emailed, but the visitor sees the
// same `ok: true` either way.
export async function submitContact(input: SubmitContactInput): Promise<ActionResult<null>> {
  return runAction(async () => {
    const parsed = submitContactSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError("VALIDATION", "Le formulaire contient des erreurs.", zodFieldErrors(parsed.error));
    }
    const data = parsed.data;
    const isSpam = data.honeypot.length > 0 || Date.now() - data.startedAt < SPAM_TIMING_MS;

    const requestHeaders = await headers();
    const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ipHash = hashIp(ip);

    if (!isSpam) {
      let allowed = true;
      try {
        const result = await contactLimiter.limit(`ip:${ipHash}`);
        allowed = result.success;
      } catch (error) {
        // Fail open — a Redis outage must never cost a sales enquiry,
        // unlike login's fail-closed policy.
        console.error(JSON.stringify({ level: "warn", event: "contact_ratelimit_unavailable" }), error);
        allowed = true;
      }
      if (!allowed) {
        throw new AppError("RATE_LIMITED", RATE_LIMITED_ERROR);
      }
    }

    const message = await db.contactMessage.create({
      data: {
        name: data.name,
        company: data.company || null,
        email: data.email,
        phone: data.phone || null,
        projectType: data.projectType || null,
        message: data.message,
        locale: toDbLocale(data.locale),
        status: isSpam ? ContactStatus.SPAM : ContactStatus.NEW,
        ipHash,
        userAgent: requestHeaders.get("user-agent") || null,
      },
    });

    // Write happens before the send, always — a Resend outage must never
    // lose a message that already made it to the database.
    if (!isSpam) {
      const settings = await getSiteSetting();
      const { sent, error } = await sendContactNotification(
        {
          name: data.name,
          company: data.company || null,
          email: data.email,
          phone: data.phone || null,
          projectType: data.projectType || null,
          message: data.message,
          locale: message.locale,
          createdAt: message.createdAt,
        },
        settings?.contactRecipients ?? [],
      );
      await db.contactMessage.update({ where: { id: message.id }, data: { emailSent: sent, emailError: error } });
    }

    updateTag(TAGS.messages);
    return null;
  });
}
