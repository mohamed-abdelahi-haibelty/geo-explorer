import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { uploadLimiter } from "@/server/services/ratelimit";
import { signUploadParams } from "@/server/services/cloudinary";
import { signRequestSchema } from "@/lib/validation/media";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: { code: "UNAUTHENTICATED", message: "Connexion requise." } }, { status: 401 });
  }

  // Fail open: an Upstash outage should not block an authenticated admin
  // from uploading — that's the degradation policy for this limiter.
  try {
    const { success } = await uploadLimiter.limit(session.user.id);
    if (!success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Trop de demandes d'envoi. Réessayez dans quelques minutes." } },
        { status: 429 },
      );
    }
  } catch (error) {
    console.error(JSON.stringify({ level: "error", event: "upload_ratelimit_failed" }), error);
  }

  const body = await request.json().catch(() => null);
  const parsed = signRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: { code: "VALIDATION", message: "Requête de signature invalide." } }, { status: 400 });
  }

  const payload = signUploadParams(parsed.data);
  return NextResponse.json(payload);
}
