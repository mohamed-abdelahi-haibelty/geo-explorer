import NextLink from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getSiteSetting } from "@/server/queries/settings";
import { listServicesPublic } from "@/server/queries/services";
import { MobileNav } from "@/components/site/mobile-nav";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import type { LocaleCode } from "@/lib/validation/locale";
import logo from "@/public/assets/logo-mark.png";

// Plain per-locale dictionaries, not getTranslations()/messages/*.json:
// next-intl's server APIs need the same runtime-data <Suspense> boundary as
// cookies()/headers() under Cache Components, and this layout is an
// ancestor of every page — including articles/[slug]/page.tsx, which stays
// deliberately outside <Suspense> so its redirect()/notFound() calls can
// set a real HTTP status. Wrapping this shared layout in Suspense would put
// a boundary above that page too and silently degrade its redirect to a
// client-side meta-refresh (see the note there).
const DICT: Record<
  LocaleCode,
  {
    home: string;
    about: string;
    services: string;
    articles: string;
    news: string;
    contact: string;
    switcherLabel: string;
    menuLabel: string;
    closeMenu: string;
    legal: string;
    rights: string;
  }
> = {
  fr: {
    home: "Accueil",
    about: "À propos",
    services: "Services",
    articles: "Articles",
    news: "Actualités",
    contact: "Contact",
    switcherLabel: "Langue",
    menuLabel: "Menu",
    closeMenu: "Fermer le menu",
    legal: "Mentions légales",
    rights: "Tous droits réservés.",
  },
  en: {
    home: "Home",
    about: "About",
    services: "Services",
    articles: "Articles",
    news: "News",
    contact: "Contact",
    switcherLabel: "Language",
    menuLabel: "Menu",
    closeMenu: "Close menu",
    legal: "Legal notice",
    rights: "All rights reserved.",
  },
  ar: {
    home: "الرئيسية",
    about: "من نحن",
    services: "الخدمات",
    articles: "المقالات",
    news: "الأخبار",
    contact: "اتصل بنا",
    switcherLabel: "اللغة",
    menuLabel: "القائمة",
    closeMenu: "إغلاق القائمة",
    legal: "الإشعار القانوني",
    rights: "جميع الحقوق محفوظة.",
  },
};

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = locale as LocaleCode;
  const t = DICT[currentLocale];
  // "use cache" queries — safe to read without <Suspense> under Cache
  // Components (that's the point of "use cache"), unlike the runtime-data
  // reads this file deliberately avoids above.
  const [settings, services] = await Promise.all([getSiteSetting(), listServicesPublic(currentLocale)]);
  const companyName = settings?.companyName ?? "GeoExplorer Services";

  const navEntries = [
    { label: t.home, href: `/${currentLocale}` },
    { label: t.about, href: `/${currentLocale}/a-propos` },
    { label: t.articles, href: `/${currentLocale}/articles` },
    { label: t.news, href: `/${currentLocale}/actualites` },
    { label: t.contact, href: `/${currentLocale}/contact` },
  ];
  const serviceEntries = services.map((service) => ({
    label: service.title,
    href: `/${currentLocale}/services/${service.slug}`,
  }));
  const mobileEntries = [
    navEntries[0],
    navEntries[1],
    { label: t.services, href: `/${currentLocale}/services` },
    navEntries[2],
    navEntries[3],
    navEntries[4],
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <NextLink
            href={`/${currentLocale}`}
            className="flex items-center gap-2.5 font-heading text-lg font-semibold tracking-tight text-foreground"
          >
            <Image src={logo} alt="" className="h-9 w-auto shrink-0" priority unoptimized />
            {companyName}
          </NextLink>

          <nav aria-label={t.menuLabel} className="hidden items-center gap-1 text-sm font-medium text-foreground lg:flex">
            <NextLink href={`/${currentLocale}`} className="rounded-lg px-3 py-2 transition-colors hover:bg-muted">
              {t.home}
            </NextLink>
            <NextLink
              href={`/${currentLocale}/a-propos`}
              className="rounded-lg px-3 py-2 transition-colors hover:bg-muted"
            >
              {t.about}
            </NextLink>

            {/* Native <details> disclosure — no JS, fully keyboard operable,
                matching the rule that only the mobile toggle and language
                switcher are client components. Positioned absolute so the
                panel never pushes the header's own layout. */}
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                {t.services}
                <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
              </summary>
              <div className="absolute start-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
                <ul className="flex flex-col p-1.5">
                  {serviceEntries.map((service, index) => (
                    <li key={service.href}>
                      <NextLink
                        href={service.href}
                        className="flex items-baseline gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground/90 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {service.label}
                      </NextLink>
                    </li>
                  ))}
                </ul>
                <NextLink
                  href={`/${currentLocale}/services`}
                  className="block border-t border-border px-3 py-2.5 font-mono text-xs text-secondary transition-colors hover:text-primary"
                >
                  {t.services} →
                </NextLink>
              </div>
            </details>

            <NextLink href={`/${currentLocale}/articles`} className="rounded-lg px-3 py-2 transition-colors hover:bg-muted">
              {t.articles}
            </NextLink>
            <NextLink href={`/${currentLocale}/actualites`} className="rounded-lg px-3 py-2 transition-colors hover:bg-muted">
              {t.news}
            </NextLink>
            <NextLink
              href={`/${currentLocale}/contact`}
              className="ms-1 rounded-lg bg-primary px-3.5 py-2 text-primary-foreground transition-colors hover:bg-primary/85"
            >
              {t.contact}
            </NextLink>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher locale={currentLocale} label={t.switcherLabel} />
            <MobileNav
              locale={currentLocale}
              entries={mobileEntries}
              services={serviceEntries}
              servicesLabel={t.services}
              menuLabel={t.menuLabel}
              closeLabel={t.closeMenu}
            />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-secondary text-secondary-foreground">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <p className="font-heading text-xl font-semibold">{companyName}</p>
            {settings?.tagline && <p className="max-w-sm text-sm text-secondary-foreground/75">{settings.tagline}</p>}
            <dl className="mt-2 flex flex-col gap-1 font-mono text-xs text-secondary-foreground/70">
              {settings?.address && <dd>{settings.address}</dd>}
              {settings?.phones && settings.phones.length > 0 && (
                <dd dir="ltr" className="text-start">
                  {settings.phones.join(" · ")}
                </dd>
              )}
              {settings?.email && (
                <dd dir="ltr" className="text-start">
                  <a href={`mailto:${settings.email}`} className="hover:text-secondary-foreground">
                    {settings.email}
                  </a>
                </dd>
              )}
            </dl>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <p className="font-mono text-[11px] tracking-wide text-secondary-foreground/55 uppercase">{t.menuLabel}</p>
            {navEntries.map((entry) => (
              <NextLink key={entry.href} href={entry.href} className="w-fit text-secondary-foreground/85 hover:text-secondary-foreground">
                {entry.label}
              </NextLink>
            ))}
            <NextLink href={`/${currentLocale}/services`} className="w-fit text-secondary-foreground/85 hover:text-secondary-foreground">
              {t.services}
            </NextLink>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <p className="font-mono text-[11px] tracking-wide text-secondary-foreground/55 uppercase">{t.services}</p>
            {serviceEntries.slice(0, 6).map((service) => (
              <NextLink
                key={service.href}
                href={service.href}
                className="w-fit text-secondary-foreground/85 hover:text-secondary-foreground"
              >
                {service.label}
              </NextLink>
            ))}
          </div>
        </div>

        <div className="border-t border-secondary-foreground/15">
          <div className="mx-auto flex max-w-6xl flex-col-reverse items-center justify-between gap-3 px-4 py-5 text-xs text-secondary-foreground/65 sm:flex-row sm:px-6">
            <p>
              © {companyName} — {t.rights}
            </p>
            <NextLink href={`/${currentLocale}/mentions-legales`} className="font-mono hover:text-secondary-foreground">
              {t.legal}
            </NextLink>
          </div>
        </div>
      </footer>
    </>
  );
}
