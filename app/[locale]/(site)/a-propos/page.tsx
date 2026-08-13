import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { ScrollReveal, ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";
import { getSection } from "@/server/queries/page-sections";
import { listPartnersPublic } from "@/server/queries/partners";
import { getMediaAssetsByIds } from "@/server/queries/media";
import { pickLocalizedText } from "@/lib/locale";
import { noindexIfFallback } from "@/lib/seo";
import { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const [intro, mission] = await Promise.all([
    getSection<"ABOUT:intro">(PageKey.ABOUT, "intro", typedLocale),
    getSection<"ABOUT:mission">(PageKey.ABOUT, "mission", typedLocale),
  ]);

  return {
    title: intro.data.heading || undefined,
    description: mission.data.body || undefined,
    alternates: { canonical: `/${locale}/a-propos` },
    robots: noindexIfFallback(typedLocale, intro.localeFallback, mission.localeFallback),
  };
}

export default function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense>
      <AboutContent params={params} />
    </Suspense>
  );
}

async function AboutContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const isRtl = typedLocale === "ar";
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const hoverShift = isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1";
  const withLocale = (path: string) => `/${typedLocale}${path.startsWith("/") ? path : `/${path}`}`;

  const [t, intro, mission, vision, strengths, team, approach, referenceDomains, partners] = await Promise.all([
    getTranslations(),
    getSection<"ABOUT:intro">(PageKey.ABOUT, "intro", typedLocale),
    getSection<"ABOUT:mission">(PageKey.ABOUT, "mission", typedLocale),
    getSection<"ABOUT:vision">(PageKey.ABOUT, "vision", typedLocale),
    getSection<"ABOUT:strengths">(PageKey.ABOUT, "strengths", typedLocale),
    getSection<"ABOUT:team">(PageKey.ABOUT, "team", typedLocale),
    getSection<"ABOUT:approach">(PageKey.ABOUT, "approach", typedLocale),
    getSection<"ABOUT:referenceDomains">(PageKey.ABOUT, "referenceDomains", typedLocale),
    listPartnersPublic(),
  ]);

  const images = await getMediaAssetsByIds(
    [intro.data.imageId, team.data.imageId, ...referenceDomains.data.items.map((item) => item.imageId)].filter(
      (id): id is string => Boolean(id),
    ),
  );
  const introImage = intro.data.imageId ? images[intro.data.imageId] : undefined;
  const teamImage = team.data.imageId ? images[team.data.imageId] : undefined;

  return (
    <>
      {/* ── INTRO — heading then subhead below it, never a kicker above ─── */}
      <section className="overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-start gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <ScrollReveal from="rise" className="flex flex-col gap-5">
            <h1 className="max-w-2xl text-balance font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
              {intro.data.heading}
            </h1>
            {intro.data.subheading && (
              <p className="font-heading text-lg font-medium text-primary">{intro.data.subheading}</p>
            )}
            <div className="mt-2 flex flex-col gap-4">
              {intro.data.body.map((paragraph, index) => (
                <p key={index} className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal from="band" className="relative aspect-square overflow-hidden rounded-2xl bg-muted md:aspect-auto md:h-full md:min-h-80">
            {introImage ? (
              <CldImage
                publicId={introImage.publicId}
                alt={pickLocalizedText(introImage.alt, typedLocale)}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                blurDataUrl={introImage.blurDataUrl}
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

      {/* ── MISSION + VISION — cobalt structural band ────────────────────── */}
      <section className="bg-secondary text-secondary-foreground">
        <ScrollRevealGroup className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 sm:py-24 md:grid-cols-2">
          <div className="flex flex-col gap-3 border-t border-secondary-foreground/25 pt-5">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">{mission.data.heading}</h2>
            <p className="max-w-md text-secondary-foreground/80">{mission.data.body}</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-secondary-foreground/25 pt-5">
            <h2 className="font-heading text-2xl font-semibold sm:text-3xl">{vision.data.heading}</h2>
            <p className="max-w-md text-secondary-foreground/80">{vision.data.body}</p>
          </div>
        </ScrollRevealGroup>
      </section>

      {/* ── STRENGTHS — vertical divided list, distinct from the home
          section's grid so the two pages don't repeat a structure ───────── */}
      {strengths.data.items.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 md:py-28">
            <ScrollReveal from="rise" className="mb-10">
              <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{strengths.data.heading}</h2>
            </ScrollReveal>
            <ScrollRevealGroup className="flex flex-col divide-y divide-border">
              {strengths.data.items.map((item) => (
                <div key={item.title} className="flex flex-col gap-1.5 py-6 first:pt-0 last:pb-0">
                  <h3 className="font-heading text-lg font-semibold text-foreground">{item.title}</h3>
                  {item.description && <p className="max-w-2xl text-sm text-muted-foreground">{item.description}</p>}
                </div>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <section className="overflow-hidden border-b border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <ScrollReveal from={teamImage ? "rise" : "band"} className="order-2 md:order-1">
            {teamImage ? (
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
                <CldImage
                  publicId={teamImage.publicId}
                  alt={pickLocalizedText(teamImage.alt, typedLocale)}
                  fill
                  sizes="(min-width: 768px) 50vw, 100vw"
                  blurDataUrl={teamImage.blurDataUrl}
                />
              </div>
            ) : (
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
                <SpectralBandRow variant="quiet" className="flex h-full w-full" />
                <ContourLine className="absolute inset-x-8 bottom-8 h-10 text-secondary/40" />
              </div>
            )}
          </ScrollReveal>
          <ScrollReveal from="rise" className="order-1 flex flex-col gap-4 md:order-2">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{team.data.heading}</h2>
            <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">{team.data.body}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── APPROACH — the one place a real sequence number belongs: it's
          the actual methodology order, not decoration ───────────────────── */}
      {approach.data.steps.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 md:py-28">
            <ScrollReveal from="rise" className="mb-14 flex max-w-2xl flex-col gap-3">
              <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{approach.data.heading}</h2>
              {approach.data.intro && <p className="text-muted-foreground">{approach.data.intro}</p>}
            </ScrollReveal>
            <ScrollRevealGroup className="relative flex flex-col sm:grid sm:grid-cols-5 sm:gap-6">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-6 hidden h-px bg-border sm:block"
                style={{ insetInlineStart: "10%", insetInlineEnd: "10%" }}
              />
              {approach.data.steps.map((step) => (
                <div key={step.number} className="relative flex flex-col gap-2 border-t border-border py-5 sm:border-t-0 sm:py-0">
                  <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-secondary font-mono text-sm font-semibold text-secondary-foreground sm:mb-4">
                    {String(step.number).padStart(2, "0")}
                  </span>
                  <h3 className="font-heading text-base font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── REFERENCE DOMAINS ────────────────────────────────────────────── */}
      {referenceDomains.data.items.length > 0 && (
        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <ScrollReveal from="rise" className="mb-10 flex max-w-2xl flex-col gap-3">
              <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{referenceDomains.data.heading}</h2>
              {referenceDomains.data.subheading && <p className="text-muted-foreground">{referenceDomains.data.subheading}</p>}
            </ScrollReveal>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {referenceDomains.data.items.map((item) => {
                const image = item.imageId ? images[item.imageId] : undefined;
                return (
                  <div key={item.title} className="flex flex-col gap-3">
                    <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-background">
                      {image ? (
                        <CldImage
                          publicId={image.publicId}
                          alt={pickLocalizedText(image.alt, typedLocale)}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                          blurDataUrl={image.blurDataUrl}
                        />
                      ) : (
                        <SpectralBandRow variant="quiet" className="flex h-full w-full" />
                      )}
                    </div>
                    <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </div>
                );
              })}
            </ScrollRevealGroup>
            {referenceDomains.data.note && <p className="mt-8 max-w-xl text-xs text-muted-foreground">{referenceDomains.data.note}</p>}
          </div>
        </section>
      )}

      {/* ── PARTNERS — renders nothing at all when there are none ────────── */}
      {partners.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <ScrollReveal from="rise" className="mb-8">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{t("site.partnersHeading")}</h2>
            </ScrollReveal>
            <ScrollRevealGroup className="flex flex-wrap items-center gap-x-10 gap-y-6">
              {partners.map((partner) => (
                <div key={partner.id} className="flex h-12 items-center">
                  {partner.logo ? (
                    <CldImage
                      publicId={partner.logo.publicId}
                      alt={partner.name}
                      width={140}
                      height={48}
                      sizes="140px"
                      blurDataUrl={partner.logo.blurDataUrl}
                      className="max-h-12 w-auto object-contain grayscale transition-all hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-mono text-sm text-muted-foreground">{partner.name}</span>
                  )}
                </div>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── CTA — two paths out of the About page ─────────────────────────── */}
      <section>
        <ScrollReveal from="rise" className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{t("site.contactCta.heading")}</h2>
          <p className="max-w-lg text-muted-foreground">{t("site.contactCta.body")}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <NextLink
              href={withLocale("/contact")}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
            >
              {t("site.contactCta.button")}
              <ForwardIcon aria-hidden="true" className="size-4" />
            </NextLink>
            <NextLink
              href={withLocale("/services")}
              className="group inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              {t("site.viewAllServices")}
              <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
            </NextLink>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
