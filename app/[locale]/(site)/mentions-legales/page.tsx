import type { Metadata } from "next";
import { ScrollReveal, ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { getSection } from "@/server/queries/page-sections";
import { noindexIfFallback } from "@/lib/seo";
import { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

// Read mode, not Persuade — a legal notice earns comprehension, not
// spectacle. No notFound()/redirect() here, so no Suspense-avoidance
// requirement either way; getSection is a "use cache" read, safe to call
// directly without a Suspense boundary regardless.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const legal = await getSection<"GLOBAL:legal">(PageKey.GLOBAL, "legal", typedLocale);

  return {
    title: legal.data.heading || undefined,
    alternates: { canonical: `/${locale}/mentions-legales` },
    robots: noindexIfFallback(typedLocale, legal.localeFallback),
  };
}

export default async function LegalNoticePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const legal = await getSection<"GLOBAL:legal">(PageKey.GLOBAL, "legal", typedLocale);

  return (
    <section>
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6 sm:py-28">
        <ScrollReveal from="rise" className="flex flex-col gap-3 border-b border-border pb-10">
          <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{legal.data.heading}</h1>
          {legal.data.intro && <p className="text-muted-foreground">{legal.data.intro}</p>}
        </ScrollReveal>

        <ScrollRevealGroup className="flex flex-col divide-y divide-border">
          {legal.data.sections.map((entry) => (
            <div key={entry.title} className="flex flex-col gap-2 py-8 first:pt-10 last:pb-0">
              <h2 className="font-heading text-lg font-semibold text-foreground">{entry.title}</h2>
              <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">{entry.body}</p>
            </div>
          ))}
        </ScrollRevealGroup>
      </div>
    </section>
  );
}
