import { redirect } from "next/navigation";
import type { Metadata } from "next";
import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { CldImage } from "@/components/media/cld-image";
import { ScrollReveal, ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";
import { getServicePublicBySlug, listServicesPublic, listPublishedServiceSlugsForStaticParams } from "@/server/queries/services";
import { pickLocalizedText, pickLocalizedArray } from "@/lib/locale";
import { noindexIfFallback } from "@/lib/seo";
import { getSiteUrl } from "@/lib/site-url";
import { getSiteSetting } from "@/server/queries/settings";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { orgInfoFromSettings, buildServiceSchema, buildBreadcrumbSchema, jsonLdGraph, BREADCRUMB_LABELS } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import type { LocaleCode } from "@/lib/validation/locale";

// DELIBERATE — redirect() to the index, not notFound(), for an unpublished
// or unknown slug. notFound() called outside <Suspense> for a param outside
// generateStaticParams crashed the production build with
// DYNAMIC_SERVER_USAGE every time (reproduced directly against `next
// start`, not dev — dev tolerated it; isolated across Promise.all vs
// sequential awaits, call order, and an explicit params-consuming
// generateStaticParams signature — none of it was the cause). This is a
// framework-level tension in Next 16.2's Cache Components: a route that
// gets a partial-prerender shell (this one does, thanks to
// generateStaticParams) can't synchronously notFound() for a param it never
// prerendered — the migration guide's own prescribed fix (await `params`
// inside <Suspense>) was tested too and only trades the crash for a soft
// 404 (HTTP 200, not-found UI patched in client-side — confirmed via
// curl, not assumed). articles/[slug]/page.tsx sidesteps this because its
// own redirect() call apparently keeps Next from attempting a partial
// shell for it at all. redirect() reliably returns a real 307 here (also
// confirmed via curl) with no Suspense needed, so an unpublished/unknown
// service sends the visitor to the still-valid services list instead of
// a 404 — arguably better UX than a dead end, and the only option that
// neither crashes nor soft-404s. Revisit if a future Next release closes
// this gap.
const DICT: Record<
  LocaleCode,
  { back: string; discover: string; otherServices: string; requestQuote: string }
> = {
  fr: { back: "Tous les services", discover: "Découvrir", otherServices: "Autres services", requestQuote: "Demander un devis pour ce service" },
  en: { back: "All services", discover: "Discover", otherServices: "Other services", requestQuote: "Request a quote for this service" },
  ar: { back: "جميع الخدمات", discover: "اكتشاف", otherServices: "خدمات أخرى", requestQuote: "اطلب عرض سعر لهذه الخدمة" },
};

// No locale param needed — Service.published is a single flat column, not
// per-translation (see listPublishedServiceSlugsForStaticParams), so the
// slug set is identical for every locale.
export async function generateStaticParams() {
  const slugs = await listPublishedServiceSlugsForStaticParams();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const service = await getServicePublicBySlug(typedLocale, slug);
  if (!service) return {};

  return {
    title: service.metaTitle || service.title,
    description: service.metaDescription || service.tagline || service.summary || undefined,
    alternates: { canonical: `/${locale}/services/${slug}` },
    robots: noindexIfFallback(typedLocale, service.isFallback),
  };
}

type PageProps = { params: Promise<{ locale: string; slug: string }> };

export default async function ServiceDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const t = DICT[typedLocale];
  const isRtl = typedLocale === "ar";
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const hoverShift = isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1";
  const withLocale = (path: string) => `/${typedLocale}${path.startsWith("/") ? path : `/${path}`}`;

  const allServices = await listServicesPublic(typedLocale);
  const rawService = await getServicePublicBySlug(typedLocale, slug);
  if (!rawService) redirect(withLocale("/services"));
  const service = rawService;
  const otherServices = allServices.filter((item) => item.slug !== slug);

  const [siteUrl, settings] = await Promise.all([getSiteUrl(), getSiteSetting()]);
  const trimmedSiteUrl = siteUrl.replace(/\/$/, "");
  const canonicalUrl = `${trimmedSiteUrl}${withLocale(`/services/${slug}`)}`;
  const org = orgInfoFromSettings(settings, trimmedSiteUrl);
  const breadcrumbLabels = BREADCRUMB_LABELS[typedLocale];
  const serviceSchema = buildServiceSchema({
    name: service.title,
    description: service.metaDescription || service.tagline || service.summary,
    url: canonicalUrl,
    imageUrl: service.hero ? cloudinaryImageUrl(service.hero.publicId, { width: 1200 }) : undefined,
    organization: org,
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: breadcrumbLabels.home, url: `${trimmedSiteUrl}/${typedLocale}` },
    { name: breadcrumbLabels.services, url: `${trimmedSiteUrl}/${typedLocale}/services` },
    { name: service.title, url: canonicalUrl },
  ]);

  return (
    <>
      <JsonLd data={jsonLdGraph([serviceSchema, breadcrumbSchema])} />
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <div className="absolute inset-0" aria-hidden="true">
          {service.hero ? (
            <div className="relative h-full w-full opacity-30">
              <CldImage publicId={service.hero.publicId} alt="" fill sizes="100vw" blurDataUrl={service.hero.blurDataUrl} className="object-cover" />
            </div>
          ) : (
            <SpectralBandRow variant="hero" className="flex h-full w-full" />
          )}
        </div>
        <div className="relative mx-auto flex max-w-4xl flex-col gap-5 px-4 py-20 sm:px-6 sm:py-28">
          <NextLink href={withLocale("/services")} className="flex w-fit items-center gap-1.5 font-mono text-xs text-secondary-foreground/70 transition-colors hover:text-secondary-foreground">
            <BackIcon aria-hidden="true" className="size-3.5" />
            {t.back}
          </NextLink>
          <div className="flex items-center gap-3">
            {service.icon && (
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <DynamicIcon name={service.icon as IconName} aria-hidden="true" className="size-6" />
              </span>
            )}
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{service.title}</h1>
          </div>
          {service.tagline && <p className="max-w-2xl text-lg text-secondary-foreground/85">{service.tagline}</p>}
          <div className="mt-2 max-w-xs text-primary/70">
            <ContourLine className="h-7 w-full" />
          </div>
        </div>
      </section>

      {service.summary && (
        <section className="border-b border-border">
          <ScrollReveal from="rise" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
            <p className="text-lg leading-relaxed text-muted-foreground">{service.summary}</p>
          </ScrollReveal>
        </section>
      )}

      {service.blocks.length > 0 && (
        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 md:py-24">
            <ScrollRevealGroup className="flex flex-col divide-y divide-border">
              {service.blocks.map((block, index) => {
                const title = pickLocalizedText(block.title, typedLocale);
                const items = pickLocalizedArray(block.items, typedLocale);
                return (
                  <div key={block.id} className="grid gap-4 py-10 first:pt-0 last:pb-0 sm:grid-cols-[auto_1fr] sm:gap-10">
                    <div className="flex items-start gap-3 sm:w-40">
                      <span className="font-mono text-xs text-muted-foreground tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                      <h2 className="font-heading text-lg font-semibold text-foreground sm:hidden">{title}</h2>
                    </div>
                    <div className="flex flex-col gap-3">
                      <h2 className="hidden font-heading text-lg font-semibold text-foreground sm:block">{title}</h2>
                      {items.length > 0 && (
                        <ul className="flex flex-col gap-2">
                          {items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                              <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      <section className="border-b border-border">
        <ScrollReveal from="rise" className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-20 text-center sm:px-6">
          <NextLink
            href={withLocale(`/contact?type=${service.slug}`)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {t.requestQuote}
            <ForwardIcon aria-hidden="true" className="size-4" />
          </NextLink>
        </ScrollReveal>
      </section>

      {otherServices.length > 0 && (
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <p className="mb-6 font-mono text-xs tracking-wide text-muted-foreground uppercase">{t.otherServices}</p>
            <ScrollRevealGroup className="flex flex-col divide-y divide-border border-y border-border">
              {otherServices.map((item) => (
                <NextLink
                  key={item.id}
                  href={withLocale(`/services/${item.slug}`)}
                  className="group flex items-center justify-between gap-4 py-5 transition-colors hover:bg-muted/40 sm:px-3"
                >
                  <span className="flex items-center gap-3">
                    {item.icon && <DynamicIcon name={item.icon as IconName} aria-hidden="true" className="size-4 text-primary" />}
                    <span className="font-heading text-base font-semibold text-foreground">{item.title}</span>
                  </span>
                  <ForwardIcon aria-hidden="true" className={`size-4 text-muted-foreground transition-transform ${hoverShift}`} />
                </NextLink>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}
    </>
  );
}
