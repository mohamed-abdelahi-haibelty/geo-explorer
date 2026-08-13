import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { CldImage } from "@/components/media/cld-image";
import { ScrollReveal } from "@/components/site/scroll-reveal";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";
import { getSection } from "@/server/queries/page-sections";
import { listServicesPublic } from "@/server/queries/services";
import { getMediaAssetsByIds } from "@/server/queries/media";
import { pickLocalizedText } from "@/lib/locale";
import { noindexIfFallback } from "@/lib/seo";
import { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const intro = await getSection<"SERVICES:intro">(PageKey.SERVICES, "intro", typedLocale);

  return {
    title: intro.data.heading || undefined,
    description: intro.data.body || undefined,
    alternates: { canonical: `/${locale}/services` },
    robots: noindexIfFallback(typedLocale, intro.localeFallback),
  };
}

export default function ServicesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense>
      <ServicesIndexContent params={params} />
    </Suspense>
  );
}

async function ServicesIndexContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const isRtl = typedLocale === "ar";
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const hoverShift = isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1";
  const withLocale = (path: string) => `/${typedLocale}${path.startsWith("/") ? path : `/${path}`}`;

  const [t, intro, services] = await Promise.all([
    getTranslations(),
    getSection<"SERVICES:intro">(PageKey.SERVICES, "intro", typedLocale),
    listServicesPublic(typedLocale),
  ]);

  const images = await getMediaAssetsByIds([intro.data.imageId].filter((id): id is string => Boolean(id)));
  const introImage = intro.data.imageId ? images[intro.data.imageId] : undefined;

  return (
    <>
      <section className="overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <ScrollReveal from="rise" className="flex flex-col gap-5">
            <h1 className="max-w-2xl text-balance font-heading text-4xl leading-[1.08] font-semibold tracking-tight text-foreground sm:text-5xl">
              {intro.data.heading}
            </h1>
            {intro.data.body && (
              <p className="max-w-prose text-lg text-muted-foreground">{intro.data.body}</p>
            )}
          </ScrollReveal>
          <ScrollReveal from="band" className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
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
                <SpectralBandRow variant="hero" className="flex h-full w-full opacity-90" />
                <ContourLine className="absolute inset-x-8 bottom-10 h-10 text-primary/70" />
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {services.length === 0 ? null : (
        <section>
          {services.map((service, index) => {
            const image = service.hero;
            return (
              <ScrollReveal key={service.id} from="rise">
                <div
                  className={`border-b border-border ${index % 2 === 1 ? "bg-muted/40" : ""}`}
                >
                  <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-20 md:flex-row md:items-center">
                    <div className="flex flex-1 flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {service.icon && (
                          <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                            <DynamicIcon name={service.icon as IconName} aria-hidden="true" className="size-5" />
                          </span>
                        )}
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {String(index + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                        </span>
                      </div>
                      <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{service.title}</h2>
                      {(service.tagline || service.summary) && (
                        <p className="max-w-prose text-muted-foreground">{service.tagline || service.summary}</p>
                      )}
                      <NextLink
                        href={withLocale(`/services/${service.slug}`)}
                        className="group mt-2 inline-flex w-fit items-center gap-2 font-mono text-sm text-secondary transition-colors hover:text-primary"
                      >
                        {t("site.discover")}
                        <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
                      </NextLink>
                    </div>
                    <NextLink
                      href={withLocale(`/services/${service.slug}`)}
                      className="relative aspect-16/10 w-full shrink-0 overflow-hidden rounded-2xl bg-muted md:w-[42%]"
                    >
                      {image ? (
                        <CldImage
                          publicId={image.publicId}
                          alt={pickLocalizedText(image.alt, typedLocale)}
                          fill
                          sizes="(min-width: 768px) 40vw, 100vw"
                          blurDataUrl={image.blurDataUrl}
                        />
                      ) : (
                        <SpectralBandRow variant="quiet" className="flex h-full w-full" />
                      )}
                    </NextLink>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </section>
      )}

      <section>
        <ScrollReveal from="rise" className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
          <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{t("site.contactCta.heading")}</h2>
          <p className="max-w-lg text-muted-foreground">{t("site.contactCta.body")}</p>
          <NextLink
            href={withLocale("/contact")}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {t("site.contactCta.button")}
            <ForwardIcon aria-hidden="true" className="size-4" />
          </NextLink>
        </ScrollReveal>
      </section>
    </>
  );
}
