import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import type { LocaleCode } from "@/lib/validation/locale";

const intlMiddleware = createMiddleware(routing);

// Cheap, cookie-presence-only check to block early and avoid a flash of
// protected content. The real session lookup lives in the (admin) layout,
// and every Server Action re-checks independently.
function adminGuard(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Forwarded so the (admin) layout can tell whether the current route is
  // already the password-change screen, without proxy doing a real DB lookup.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

// next-intl's own cookie/Accept-Language detection is disabled
// (localeDetection: false in i18n/routing.ts) — this implements the exact
// resolved behavior instead: bare "/" honors a previously-set NEXT_LOCALE
// cookie when it names a supported, non-default locale; otherwise it falls
// through to next-intl's own defaultLocale ("fr") redirect. Every other
// public URL already carries its own locale prefix and needs no
// special-casing — next-intl keeps the cookie in sync with whichever
// locale-prefixed page the visitor is actually on.
function localeRootRedirect(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/") return null;
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (!isSupportedLocale(cookieLocale) || cookieLocale === routing.defaultLocale) return null;
  return NextResponse.redirect(new URL(`/${cookieLocale}`, request.url));
}

function isSupportedLocale(value: string | undefined): value is LocaleCode {
  return value != null && (routing.locales as readonly string[]).includes(value);
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return adminGuard(request);
  }
  return localeRootRedirect(request) ?? intlMiddleware(request);
}

export const config = {
  // Every route except Next internals, static files, and the French-only
  // internal surfaces (login/apercu/api), which keep plain unprefixed
  // routing untouched by next-intl. /admin/:path* is included (routed to
  // adminGuard above), matching this file's previous, narrower matcher.
  matcher: ["/((?!_next|api|login|apercu|.*\\..*).*)"],
};
