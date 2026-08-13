import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Check, Mail, MapPin, Phone } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ScrollReveal, ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";
import { ContactForm } from "@/components/site/contact-form";
import { getSection } from "@/server/queries/page-sections";
import { getSiteSetting } from "@/server/queries/settings";
import { listServicesPublic } from "@/server/queries/services";
import { getMediaAssetsByIds } from "@/server/queries/media";
import { pickLocalizedText } from "@/lib/locale";
import { noindexIfFallback } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import { orgInfoFromSettings, buildLocalBusinessSchema, jsonLdGraph } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

// Code-split from the page's main chunk — `ssr: true` (the default) keeps
// the static preview markup server-rendered, only the click-to-load
// iframe swap's own JS is deferred.
const ContactMap = dynamic(() => import("@/components/site/contact-map").then((mod) => mod.ContactMap));

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const [hero, formIntro] = await Promise.all([
    getSection<"CONTACT:hero">(PageKey.CONTACT, "hero", typedLocale),
    getSection<"CONTACT:formIntro">(PageKey.CONTACT, "formIntro", typedLocale),
  ]);

  return {
    title: hero.data.heading || undefined,
    description: formIntro.data.body || hero.data.body || undefined,
    alternates: { canonical: `/${locale}/contact` },
    robots: noindexIfFallback(typedLocale, hero.localeFallback, formIntro.localeFallback),
  };
}

// `searchParams` (the `?type=` prefill) isn't statically enumerable — same
// Suspense requirement as every other query-param-driven page.
export default function ContactPage(props: PageProps) {
  return (
    <Suspense>
      <ContactContent {...props} />
    </Suspense>
  );
}

async function ContactContent({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const { type } = await searchParams;

  const [t, hero, formIntro, projectTypes, settings, services, siteUrl] = await Promise.all([
    getTranslations("contact"),
    getSection<"CONTACT:hero">(PageKey.CONTACT, "hero", typedLocale),
    getSection<"CONTACT:formIntro">(PageKey.CONTACT, "formIntro", typedLocale),
    getSection<"CONTACT:projectTypes">(PageKey.CONTACT, "projectTypes", typedLocale),
    getSiteSetting(),
    listServicesPublic(typedLocale),
    getSiteUrl(),
  ]);

  const org = orgInfoFromSettings(settings, siteUrl.replace(/\/$/, ""));
  const localBusinessSchema = buildLocalBusinessSchema({ org, latitude: settings?.latitude, longitude: settings?.longitude });

  const images = hero.data.imageId ? await getMediaAssetsByIds([hero.data.imageId]) : {};
  const heroImage = hero.data.imageId ? images[hero.data.imageId] : undefined;

  // `?type=<service-slug>` is what every CTA across the site actually sends
  // (see services/[slug]/page.tsx's "Demander un devis" link) — project
  // types are free-text editable copy with no foreign key to Service, so
  // the match is by title against the same locale's published services,
  // the one place the two lists are known to line up (prisma/seed.ts).
  const slugByLabel = new Map(services.map((service) => [service.title, service.slug]));
  const defaultProjectType = type
    ? projectTypes.data.items.find((label) => slugByLabel.get(label) === type)
    : undefined;

  return (
    <>
      <JsonLd data={jsonLdGraph([localBusinessSchema])} />
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <ScrollReveal from="rise" className="flex flex-col gap-5">
            <h1 className="max-w-2xl text-balance font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
              {hero.data.heading}
            </h1>
            {hero.data.body && (
              <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">{hero.data.body}</p>
            )}
            {hero.data.values.length > 0 && (
              <ScrollRevealGroup className="mt-2 flex flex-wrap gap-2">
                {hero.data.values.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    <Check aria-hidden="true" className="size-3.5 text-primary" />
                    {value}
                  </span>
                ))}
              </ScrollRevealGroup>
            )}
          </ScrollReveal>
          <ScrollReveal from="band" className="relative aspect-square overflow-hidden rounded-2xl bg-muted md:aspect-auto md:h-full md:min-h-80">
            {heroImage ? (
              <CldImage
                publicId={heroImage.publicId}
                alt={pickLocalizedText(heroImage.alt, typedLocale)}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                blurDataUrl={heroImage.blurDataUrl}
              />
            ) : (
              <div className="absolute inset-0">
                <SpectralBandRow variant="quiet" className="flex h-full w-full" />
                <ContourLine className="absolute inset-x-8 bottom-10 h-10 text-secondary/40" />
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ── FORM + DETAILS — muted band, details/map left, form right ─────── */}
      <section className="bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.85fr_1.15fr] md:py-28">
          <ScrollReveal from="rise" className="flex flex-col gap-8">
            {formIntro.data.body && (
              <p className="max-w-md text-[15px] leading-relaxed text-muted-foreground">{formIntro.data.body}</p>
            )}

            <div className="flex flex-col gap-3 border-t border-border pt-6">
              <p className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">{t("detailsHeading")}</p>
              <dl className="flex flex-col gap-2.5 text-sm">
                {settings?.address && (
                  <div className="flex items-start gap-2.5 text-foreground">
                    <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <dd>{settings.address}</dd>
                  </div>
                )}
                {settings?.phones && settings.phones.length > 0 && (
                  <div className="flex items-start gap-2.5 text-foreground">
                    <Phone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <dd dir="ltr" className="text-start font-mono text-[13px]">
                      {settings.phones.join(" · ")}
                    </dd>
                  </div>
                )}
                {settings?.email && (
                  <div className="flex items-start gap-2.5 text-foreground">
                    <Mail aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    <dd dir="ltr" className="text-start font-mono text-[13px]">
                      <a href={`mailto:${settings.email}`} className="hover:text-primary">
                        {settings.email}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <ContactMap embedUrl={settings?.mapEmbedUrl ?? null} cta={t("mapCta")} label={t("mapLabel")} />
          </ScrollReveal>

          <ScrollReveal from="rise" delay={0.1} className="rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
            <ContactForm
              locale={typedLocale}
              labels={{
                fields: {
                  name: t("fields.name"),
                  namePlaceholder: t("fields.namePlaceholder"),
                  company: t("fields.company"),
                  companyPlaceholder: t("fields.companyPlaceholder"),
                  email: t("fields.email"),
                  emailPlaceholder: t("fields.emailPlaceholder"),
                  phone: t("fields.phone"),
                  phonePlaceholder: t("fields.phonePlaceholder"),
                  projectType: t("fields.projectType"),
                  projectTypePlaceholder: t("fields.projectTypePlaceholder"),
                  message: t("fields.message"),
                  messagePlaceholder: t("fields.messagePlaceholder"),
                },
                consent: t("consent"),
                submit: t("submit"),
                submitting: t("submitting"),
                successHeading: t("successHeading"),
                successBody: t("successBody"),
                successReset: t("successReset"),
                errorFallback: t("errorFallback"),
              }}
              projectTypes={projectTypes.data.items}
              defaultProjectType={defaultProjectType}
            />
          </ScrollReveal>
        </div>
      </section>
    </>
  );
}
