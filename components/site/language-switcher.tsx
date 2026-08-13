"use client";

import { useRef, useEffect } from "react";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";

const LOCALE_LABEL: Record<LocaleCode, string> = { fr: "FR", en: "EN", ar: "AR" };

// Plain <a> tags, not next/link — and hrefs upgraded via a ref mutation in
// an effect, not React state (setState synchronously in an effect is a
// cascading-render footgun the lint rule catches). A DOM mutation on a
// next/link's rendered <a> wouldn't even take effect on click — Link's
// click handler reads its React `href` prop, not the live DOM attribute —
// so a plain anchor is also the only way this actually works. Server/build
// output always points at the locale root (a safe, fully static default,
// and next/navigation's usePathname() isn't an option here either — see
// (site)/layout.tsx's note on why nothing in this tree may force a
// Suspense boundary); the effect upgrades every href to preserve the
// current path once mounted, after hydration.
export function LanguageSwitcher({ locale, label }: { locale: LocaleCode; label: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rest = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
    if (!rest) return;
    const links = containerRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-locale]");
    links?.forEach((link) => {
      link.href = `/${link.dataset.locale}${rest}`;
    });
  }, []);

  return (
    <div ref={containerRef} className="flex items-center gap-2 font-mono text-xs" aria-label={label}>
      {LOCALES.map((otherLocale) => (
        <a
          key={otherLocale}
          data-locale={otherLocale}
          href={`/${otherLocale}`}
          aria-current={otherLocale === locale ? "true" : undefined}
          className={
            otherLocale === locale
              ? "font-semibold text-foreground"
              : "text-muted-foreground transition-colors hover:text-foreground"
          }
        >
          {LOCALE_LABEL[otherLocale]}
        </a>
      ))}
    </div>
  );
}
