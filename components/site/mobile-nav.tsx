"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { isNavActive } from "@/lib/nav-active";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/lib/validation/locale";

export type NavEntry = { label: string; href: string };

// The one nav-related client island the shell needs — only the mobile menu
// toggle and the switcher are client components. Base UI's Dialog
// underneath Sheet supplies focus trap, Escape-to-close and aria-modal for
// free; this only supplies the marketing chrome around it.
export function MobileNav({
  locale,
  entries,
  services,
  servicesLabel,
  menuLabel,
  closeLabel,
  pathname,
  homeHref,
}: {
  locale: LocaleCode;
  entries: NavEntry[];
  services: NavEntry[];
  servicesLabel: string;
  menuLabel: string;
  closeLabel: string;
  /** Current URL, supplied by SiteNav — this component is never the one that
      reads it, so it stays usable outside a Suspense boundary. */
  pathname: string | null;
  homeHref: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={menuLabel}
        className="flex size-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5" />
      </SheetTrigger>
      <SheetContent side="top" className="max-h-[85vh] overflow-y-auto rounded-b-2xl border-b border-border p-0">
        <SheetTitle className="sr-only">{menuLabel}</SheetTitle>
        <SheetDescription className="sr-only">{closeLabel}</SheetDescription>
        <nav className="flex flex-col gap-1 px-5 py-6 font-heading text-lg">
          {entries.map((entry, index) => {
            const active = isNavActive(pathname, entry.href, entry.href === homeHref);
            return (
              <NextLink
                key={entry.href}
                href={entry.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-baseline gap-3 rounded-lg px-2 py-2.5 transition-colors",
                  active ? "bg-muted font-semibold text-foreground" : "text-foreground hover:bg-muted",
                )}
              >
                <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                {entry.label}
              </NextLink>
            );
          })}
        </nav>
        {services.length > 0 && (
          <div className="border-t border-border px-5 py-5">
            <p className="mb-2 font-mono text-xs tracking-wide text-muted-foreground uppercase">{servicesLabel}</p>
            <ul className="flex flex-col gap-0.5">
              {services.map((service) => {
                const active = isNavActive(pathname, service.href);
                return (
                  <li key={service.href}>
                    <NextLink
                      href={service.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-lg px-2 py-2 text-sm transition-colors",
                        active
                          ? "bg-muted font-medium text-foreground"
                          : "text-foreground/85 hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {service.label}
                    </NextLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="border-t border-border px-5 py-3 font-mono text-[11px] text-muted-foreground" data-locale={locale}>
          GeoExplorer Services
        </p>
      </SheetContent>
    </Sheet>
  );
}
