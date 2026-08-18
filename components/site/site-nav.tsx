"use client";

import { useEffect, useRef } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { MobileNav, type NavEntry } from "@/components/site/mobile-nav";
import { isNavActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/lib/validation/locale";

export type SiteNavProps = {
  locale: LocaleCode;
  /** Rendered before the Services disclosure. First entry is the locale home. */
  leading: NavEntry[];
  /** Rendered after the Services disclosure. */
  trailing: NavEntry[];
  contact: NavEntry;
  services: NavEntry[];
  servicesHref: string;
  labels: { services: string; switcher: string; menu: string; close: string };
};

const LINK_BASE = "rounded-lg px-3 py-2 transition-colors";
// The active pill is the same gray as the hover (--muted), so the menu reads
// as one neutral family rather than introducing a second tone; the weight bump
// is what separates "you are here" from "you are pointing at this".
const LINK_ACTIVE = "bg-muted font-semibold text-foreground";
const LINK_IDLE = "hover:bg-muted";

/**
 * Header navigation. Client-side because two things depend on the URL the
 * visitor is actually on, which a server-rendered layout cannot know: the
 * active-page highlight (a layout does not re-render across navigations), and
 * closing the Services disclosure — a bare <details> keeps whatever `open`
 * state it had, so once opened it stayed open across every subsequent
 * client-side navigation until manually dismissed.
 */
export function SiteNav(props: SiteNavProps) {
  const pathname = usePathname();
  return <SiteNavBar {...props} pathname={pathname} />;
}

export function SiteNavBar({
  locale,
  leading,
  trailing,
  contact,
  services,
  servicesHref,
  labels,
  pathname,
}: SiteNavProps & { pathname: string | null }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const homeHref = leading[0]?.href ?? `/${locale}`;
  const servicesActive = isNavActive(pathname, servicesHref);
  const mobileEntries = [...leading, { label: labels.services, href: servicesHref }, ...trailing, contact];

  function closeServices() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  // Collapse on every route change — covers the in-panel links, and also a
  // navigation started anywhere else on the page while the panel is open.
  useEffect(() => {
    closeServices();
  }, [pathname]);

  // A <details> has no light-dismiss of its own: without these it also stayed
  // open when the visitor clicked elsewhere on the page or pressed Escape.
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const element = detailsRef.current;
      if (element?.open && !element.contains(event.target as Node)) element.open = false;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeServices();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function navLink(entry: NavEntry) {
    const active = isNavActive(pathname, entry.href, entry.href === homeHref);
    return (
      <NextLink
        key={entry.href}
        href={entry.href}
        aria-current={active ? "page" : undefined}
        className={cn(LINK_BASE, active ? LINK_ACTIVE : LINK_IDLE)}
      >
        {entry.label}
      </NextLink>
    );
  }

  return (
    <>
      <nav aria-label={labels.menu} className="hidden items-center gap-1 text-sm font-medium text-foreground lg:flex">
        {leading.map(navLink)}

        {/* Still a native <details> disclosure — keyboard operable and open
            without JS — now with the dismissal behaviour it lacks natively. */}
        <details ref={detailsRef} className="group relative">
          <summary
            aria-current={servicesActive ? "page" : undefined}
            className={cn(
              LINK_BASE,
              "flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden",
              servicesActive ? LINK_ACTIVE : LINK_IDLE,
            )}
          >
            {labels.services}
            <ChevronDown aria-hidden="true" className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute start-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
            <ul className="flex flex-col p-1.5">
              {services.map((service, index) => {
                const active = isNavActive(pathname, service.href);
                return (
                  <li key={service.href}>
                    <NextLink
                      href={service.href}
                      onClick={closeServices}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-baseline gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-foreground/90 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {service.label}
                    </NextLink>
                  </li>
                );
              })}
            </ul>
            <NextLink
              href={servicesHref}
              onClick={closeServices}
              className="block border-t border-border px-3 py-2.5 font-mono text-xs text-secondary transition-colors hover:text-primary"
            >
              {labels.services} →
            </NextLink>
          </div>
        </details>

        {trailing.map(navLink)}

        <NextLink
          href={contact.href}
          aria-current={isNavActive(pathname, contact.href) ? "page" : undefined}
          className={cn(
            "ms-1 rounded-lg px-3.5 py-2 text-primary-foreground transition-colors",
            isNavActive(pathname, contact.href) ? "bg-primary/85 ring-2 ring-primary/30" : "bg-primary hover:bg-primary/85",
          )}
        >
          {contact.label}
        </NextLink>
      </nav>

      <div className="flex items-center gap-3">
        <LanguageSwitcher locale={locale} label={labels.switcher} />
        <MobileNav
          locale={locale}
          entries={mobileEntries}
          services={services}
          servicesLabel={labels.services}
          menuLabel={labels.menu}
          closeLabel={labels.close}
          pathname={pathname}
          homeHref={homeHref}
        />
      </div>
    </>
  );
}
