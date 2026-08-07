import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { FONT_VARIABLES, SITE_TITLE, SITE_DESCRIPTION, DIRECTION_CONTRACT, thmanyaSans } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site-url";
import type { LocaleCode } from "@/lib/validation/locale";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// metadataBase lets every descendant page's generateMetadata use relative
// `alternates`/canonical URLs (Task 04a step 12's hreflang/canonical
// requirement) instead of hand-building absolute ones everywhere.
export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = await getSiteUrl();
  return {
    metadataBase: new URL(siteUrl),
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  };
}

const RTL_LOCALES: readonly LocaleCode[] = ["ar"];

// No <NextIntlClientProvider> here on purpose: nothing in the public site
// currently uses next-intl's *client* hooks (useTranslations etc.) — every
// page so far reads messages server-side via getTranslations(). The
// provider is an async Server Component that self-fetches messages (an
// uncached read under Cache Components) and therefore needs its own
// <Suspense> boundary; wrapping it around every page here would put a
// Suspense boundary above every route in the tree, which silently degrades
// redirect()/notFound() from a real HTTP status to a client-side
// meta-refresh (see next/navigation's redirect() docs on "streaming
// context") — exactly the problem the publications-independence redirect
// in articles/[slug]/page.tsx depends on not having. Add the provider
// locally, wrapped in its own <Suspense>, around whichever future client
// island actually needs it — not here.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  const typedLocale = locale as LocaleCode;

  // Statically-enumerated segment (generateStaticParams above) — reading it
  // here doesn't force the route dynamic under Cache Components, unlike a
  // genuinely request-time API (cookies()/headers()/draftMode()). setRequestLocale
  // is what lets next-intl's server APIs (getTranslations, etc.) stay
  // synchronous-safe during static rendering — see next-intl's App Router guide.
  setRequestLocale(typedLocale);

  const dir = RTL_LOCALES.includes(typedLocale) ? "rtl" : "ltr";
  // Arabic font variable only loaded on ar — app/globals.css's
  // `html[lang="ar"]` rule is what actually switches --font-sans to it.
  const fontVariables = typedLocale === "ar" ? `${FONT_VARIABLES} ${thmanyaSans.variable}` : FONT_VARIABLES;

  return (
    <html lang={typedLocale} dir={dir} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
        {children}
      </body>
    </html>
  );
}
