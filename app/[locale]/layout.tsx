import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import "../globals.css";
import { routing } from "@/i18n/routing";
import { FONT_VARIABLES, SITE_TITLE, SITE_DESCRIPTION, DIRECTION_CONTRACT, thmanyaSans } from "@/lib/fonts";
import { getSiteUrl } from "@/lib/site-url";
import { getSiteSetting, getDefaultOgImagePublicId } from "@/server/queries/settings";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { orgInfoFromSettings, buildOrganizationSchema, buildWebSiteSchema, jsonLdGraph } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import type { LocaleCode } from "@/lib/validation/locale";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Facebook's og:locale accepts a fixed list of `language_TERRITORY` codes,
// not an arbitrary combination — these are the closest real entries for
// each of the three site locales.
const OG_LOCALE: Record<LocaleCode, string> = { fr: "fr_FR", en: "en_US", ar: "ar_AR" };

// metadataBase lets every descendant page's generateMetadata use relative
// `alternates`/canonical URLs (needed for hreflang/canonical) instead of
// hand-building absolute ones everywhere. The title template applies to
// every descendant page that sets its own plain-string `title` without
// needing to touch each one individually.
// `openGraph`/`twitter` deliberately omit `title`/`description`: Next backs
// them onto the final *resolved* title/description of whichever segment
// actually renders (see next/dist/lib/metadata's opengraph resolver), so a
// page-specific og:title falls out of this for free instead of every page
// needing its own `openGraph` block (which would otherwise fully replace —
// not merge with — this one, per Next's shallow per-segment metadata merge).
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const [siteUrl, settings, ogImagePublicId] = await Promise.all([
    getSiteUrl(),
    getSiteSetting(),
    getDefaultOgImagePublicId(),
  ]);
  const companyName = settings?.companyName ?? "GeoExplorer Services";
  const ogImageUrl = ogImagePublicId ? cloudinaryImageUrl(ogImagePublicId, { width: 1200 }) : undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: { default: SITE_TITLE, template: `%s | ${companyName}` },
    description: SITE_DESCRIPTION,
    openGraph: {
      siteName: companyName,
      type: "website",
      locale: OG_LOCALE[locale as LocaleCode],
      ...(ogImageUrl ? { images: [{ url: ogImageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image" },
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

  // "use cache" queries — safe to read without <Suspense> under Cache
  // Components, same reasoning as the (site) layout's settings/services
  // reads. Organization + WebSite JSON-LD sit once at the root; every
  // other JSON-LD block on a page references `#organization` by `@id`
  // instead of repeating these fields.
  const [siteUrl, settings] = await Promise.all([getSiteUrl(), getSiteSetting()]);
  const org = orgInfoFromSettings(settings, siteUrl.replace(/\/$/, ""));

  return (
    <html lang={typedLocale} dir={dir} className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div hidden dangerouslySetInnerHTML={{ __html: `<!--${DIRECTION_CONTRACT}-->` }} />
        <JsonLd data={jsonLdGraph([buildOrganizationSchema(org), buildWebSiteSchema(org)])} />
        {children}
      </body>
    </html>
  );
}
