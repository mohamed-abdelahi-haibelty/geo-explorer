"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/server/auth";
import { loginLimiter } from "@/server/services/ratelimit";
import { hashIp } from "@/lib/hash-ip";
import type { ActionResult } from "@/lib/errors";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

// One message for wrong password and unknown email only — no user
// enumeration on credential checks. See error-handling.md
// "Security-Sensitive Messaging". Validation and rate-limiting get their
// own distinct messages: neither leaks whether an account exists.
const UNIFORM_ERROR = "Adresse e-mail ou mot de passe incorrect.";
const VALIDATION_ERROR = "Veuillez renseigner une adresse e-mail valide et un mot de passe.";
const RATE_LIMITED_ERROR = "Trop de tentatives de connexion. Réessayez dans quelques minutes.";

export async function login(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION", message: VALIDATION_ERROR };
  }

  const email = parsed.data.email.toLowerCase();
  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  let allowed: boolean;
  try {
    const [ipResult, emailResult] = await Promise.all([
      loginLimiter.limit(`ip:${hashIp(ip)}`),
      loginLimiter.limit(`email:${email}`),
    ]);
    allowed = ipResult.success && emailResult.success;
  } catch (error) {
    // Redis unavailable → fail closed on login.
    console.error(JSON.stringify({ level: "error", event: "ratelimit_unavailable", code: "RATE_LIMITED" }), error);
    allowed = false;
  }

  if (!allowed) {
    return { ok: false, code: "RATE_LIMITED", message: RATE_LIMITED_ERROR };
  }

  let mustChangePassword: boolean;
  try {
    const result = await auth.api.signInEmail({ body: { email, password: parsed.data.password } });
    // Better Auth's additionalFields typing widened to include null/undefined;
    // the schema's own defaultValue is true, so an unset flag forces the change.
    mustChangePassword = result.user.mustChangePassword ?? true;
  } catch {
    return { ok: false, code: "UNAUTHENTICATED", message: UNIFORM_ERROR };
  }

  // Redirect straight to the final destination instead of letting AdminGate
  // bounce a second time — chaining that redirect through the same RSC
  // response Cache Components streams back sends the client router into an
  // infinite refetch loop on the target route. See PASSWORD_CHANGE_PATH in
  // components/admin/admin-gate.tsx.
  if (mustChangePassword) {
    redirect("/admin/compte");
  }

  const nextParam = formData.get("next");
  const next = typeof nextParam === "string" && nextParam.startsWith("/admin") ? nextParam : "/admin";
  redirect(next);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
