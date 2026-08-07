import NextLink from "next/link";
import { getSiteSetting } from "@/server/queries/settings";
import type { LocaleCode } from "@/lib/validation/locale";

const ARTICLES_LABEL: Record<LocaleCode, string> = { fr: "Articles", en: "Articles", ar: "المقالات" };

// Placeholder body — Task 04a proves locale routing/publications/fallback
// mechanics; the real Home (PageSection-driven hero, values, etc.) is
// Task 07's scope. Plain dictionary + next/link, not getTranslations()/
// next-intl's Link — same reasoning as (site)/layout.tsx: this route has no
// <Suspense> boundary of its own, and next-intl's server APIs need one.
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const settings = await getSiteSetting();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
      <h1 className="font-heading text-3xl text-foreground">
        {settings?.companyName ?? "GeoExplorer Services"}
      </h1>
      {settings?.tagline && <p className="text-lg text-muted-foreground">{settings.tagline}</p>}
      <NextLink
        href={`/${typedLocale}/articles`}
        className="w-fit text-sm font-medium text-secondary underline underline-offset-2"
      >
        {ARTICLES_LABEL[typedLocale]}
      </NextLink>
    </div>
  );
}
