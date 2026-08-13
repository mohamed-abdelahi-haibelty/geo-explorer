import { Resend } from "resend";
import { env } from "@/server/env";
import type { Locale } from "@/prisma/generated/client";

const resend = new Resend(env.RESEND_API_KEY);

const LOCALE_LABEL: Record<Locale, string> = { FR: "Français", EN: "Anglais", AR: "Arabe" };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string | null) {
  if (!value) return "";
  return `<tr><td style="padding:4px 12px 4px 0;color:#666;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:4px 0;">${escapeHtml(value)}</td></tr>`;
}

export type ContactNotificationInput = {
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  projectType: string | null;
  message: string;
  locale: Locale;
  createdAt: Date;
};

// The internal notification is always French — it's read by the client's own
// staff, never by the visitor. `replyTo` is the visitor's address, so a
// plain "Reply" in the client's mail app goes straight back to them.
export async function sendContactNotification(
  input: ContactNotificationInput,
  recipients: string[],
): Promise<{ sent: boolean; error: string | null }> {
  if (recipients.length === 0) {
    return { sent: false, error: "Aucun destinataire configuré (SiteSetting.contactRecipients)." };
  }

  const html = `
    <div style="font-family:sans-serif;font-size:14px;color:#111;">
      <h2 style="margin:0 0 16px;">Nouveau message de contact</h2>
      <table cellpadding="0" cellspacing="0">
        ${row("Nom", input.name)}
        ${row("Société", input.company)}
        ${row("E-mail", input.email)}
        ${row("Téléphone", input.phone)}
        ${row("Type de projet", input.projectType)}
        ${row("Langue du visiteur", LOCALE_LABEL[input.locale])}
        ${row("Reçu le", input.createdAt.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }))}
      </table>
      <p style="margin:16px 0 4px;color:#666;">Message :</p>
      <p style="white-space:pre-line;margin:0;">${escapeHtml(input.message)}</p>
    </div>
  `.trim();

  try {
    const { error } = await resend.emails.send({
      from: env.CONTACT_FROM_EMAIL,
      to: recipients,
      replyTo: input.email,
      subject: `Nouveau message — ${input.name}`,
      html,
    });
    if (error) {
      return { sent: false, error: error.message };
    }
    return { sent: true, error: null };
  } catch (error) {
    // Never let a Resend outage throw past the caller — per the degradation
    // policy, the row is already persisted, this only decides what
    // emailSent/emailError end up holding.
    console.error(JSON.stringify({ level: "error", event: "contact_email_failed" }), error);
    return { sent: false, error: error instanceof Error ? error.message : "Erreur inconnue lors de l'envoi." };
  }
}
