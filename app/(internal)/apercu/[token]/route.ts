import { draftMode } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifyPreviewToken } from "@/server/services/preview-token";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = verifyPreviewToken(token);
  // Never confirm whether a draft exists for an invalid/expired token
  // (error-handling.md) — a generic 404, same as an unknown route.
  if (!payload) notFound();
  const draft = await draftMode();
  draft.enable();
  redirect(`/apercu/voir/${payload.id}?locale=${payload.locale}`);
}
