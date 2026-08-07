import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/server/env";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";

// "Short-lived" per architecture-full.md §11 point 3 — long enough to open
// the link and read the draft, short enough that a leaked link goes stale fast.
const TOKEN_TTL_MS = 15 * 60 * 1000;

// Locale (Task 04a) — a preview link previews one specific translation, not
// "the article" in the abstract; publish state and content both differ per
// locale, so the token has to say which one.
type PreviewPayload = { id: string; type: "article"; locale: LocaleCode; exp: number };

function sign(payload: string): string {
  return createHmac("sha256", env.REVALIDATE_SECRET).update(payload).digest("base64url");
}

export function signPreviewToken(input: { id: string; type: "article"; locale: LocaleCode }): string {
  const payload: PreviewPayload = { ...input, exp: Date.now() + TOKEN_TTL_MS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyPreviewToken(token: string): PreviewPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = Buffer.from(sign(body));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PreviewPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (payload.type !== "article" || typeof payload.id !== "string") return null;
    if (!(LOCALES as readonly string[]).includes(payload.locale)) return null;
    return payload;
  } catch {
    return null;
  }
}
