import NextLink from "next/link";
import { getSiteSetting } from "@/server/queries/settings";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";

const LOCALE_SHORT: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

// Plain per-locale dictionaries, not getTranslations()/messages/*.json:
// next-intl's server APIs need the same runtime-data <Suspense> boundary as
// cookies()/headers() under Cache Components, and this layout is an
// ancestor of every page — including articles/[slug]/page.tsx, which stays
// deliberately outside <Suspense> so its redirect()/notFound() calls can
// set a real HTTP status. Wrapping this shared layout in Suspense would put
// a boundary above that page too and silently degrade its redirect to a
// client-side meta-refresh (see the note there). A handful of nav labels
// don't need the message-catalog machinery anyway.
const NAV_LABELS: Record<LocaleCode, { articles: string; search: string; switcherLabel: string }> = {
  fr: { articles: "Articles", search: "Rechercher", switcherLabel: "Langue" },
  en: { articles: "Articles", search: "Search", switcherLabel: "Language" },
  ar: { articles: "المقالات", search: "بحث", switcherLabel: "اللغة" },
};

// Minimal public shell (Task 04a's scope stops here — Home/About/Services/
// Contact bodies and any real visual design are Task 07). Just enough
// chrome to prove locale routing, navigation and the language switcher.
export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locale as LocaleCode;
  const t = NAV_LABELS[currentLocale];
  // "use cache" query — safe to read without <Suspense> under Cache
  // Components (that's the point of "use cache"), unlike the runtime-data
  // reads this file deliberately avoids above.
  const settings = await getSiteSetting();
  const companyName = settings?.companyName ?? "GeoExplorer Services";

  return (
    <>
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <NextLink href={`/${currentLocale}`} className="font-heading text-lg text-foreground">
            {companyName}
          </NextLink>
          <nav className="flex items-center gap-4 text-sm text-foreground">
            <NextLink href={`/${currentLocale}/articles`}>{t.articles}</NextLink>
            <NextLink href={`/${currentLocale}/recherche`}>{t.search}</NextLink>
          </nav>
          {/* Plain next/link throughout this layout, not next-intl's Link:
              next-intl's Link needs the same runtime request-config resolution
              as getTranslations() (see the note above this component) even
              for same-locale hrefs, which is exactly what this layout must
              avoid since it's an ancestor of articles/[slug]/page.tsx. */}
          <div className="flex items-center gap-2 font-mono text-xs" aria-label={t.switcherLabel}>
            {LOCALES.map((otherLocale) => (
              <NextLink
                key={otherLocale}
                href={`/${otherLocale}`}
                aria-current={otherLocale === currentLocale ? "true" : undefined}
                className={otherLocale === currentLocale ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}
              >
                {LOCALE_SHORT[otherLocale]}
              </NextLink>
            ))}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {/* No live new Date() here — Cache Components requires uncached/request
          data be read before the current time in a Server Component, and a
          copyright year isn't worth forcing this otherwise-static shell
          dynamic for. */}
      <footer className="border-t border-border px-4 py-6 text-center text-xs text-muted-foreground">
        {companyName}
      </footer>
    </>
  );
}
