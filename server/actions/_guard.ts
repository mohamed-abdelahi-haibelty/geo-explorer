import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { AppError } from "@/lib/errors";

// Every Server Action starts with this — the (admin) layout guard means
// nothing to a Server Action, since it's a public HTTP endpoint on its own.
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new AppError("UNAUTHENTICATED", "Connexion requise.");
  }
  return session.user;
}
