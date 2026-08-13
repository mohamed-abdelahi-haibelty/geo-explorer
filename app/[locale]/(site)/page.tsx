import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import NextLink from "next/link";
import { CldImage } from "@/components/media/cld-image";
import { ScrollReveal, ScrollRevealGroup } from "@/components/site/scroll-reveal";
import { HeroIntro } from "@/components/site/hero-intro";
import { SpectralBandRow, ContourLine } from "@/components/site/spectral-bands";
import { getSection } from "@/server/queries/page-sections";
import { listServicesPublic } from "@/server/queries/services";
import { listPartnersPublic } from "@/server/queries/partners";
import { listLatestArticlesPublic } from "@/server/queries/articles";
import { listLatestNewsPublic } from "@/server/queries/news";
import { getMediaAssetsByIds } from "@/server/queries/media";
import { pickLocalizedText } from "@/lib/locale";
import { formatDate } from "@/lib/format-date";
import { noindexIfFallback } from "@/lib/seo";
import { PageKey } from "@/prisma/generated/client";
import type { LocaleCode } from "@/lib/validation/locale";

const COORDINATES: Record<LocaleCode, string> = {
  fr: "18°04′ N — 15°57′ O · Nouakchott",
  en: "18°04′ N — 15°57′ W · Nouakchott",
  ar: "18°04′ ش — 15°57′ غ · نواكشوط",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const [hero, whoWeAre] = await Promise.all([
    getSection<"HOME:hero">(PageKey.HOME, "hero", typedLocale),
    getSection<"HOME:whoWeAre">(PageKey.HOME, "whoWeAre", typedLocale),
  ]);

  return {
    title: hero.data.title || undefined,
    description: whoWeAre.data.lead || undefined,
    alternates: { canonical: `/${locale}` },
    robots: noindexIfFallback(typedLocale, hero.localeFallback, whoWeAre.localeFallback),
  };
}

// `searchParams`-free but still built on the same "outer stays sync" shape
// as articles/page.tsx: this page uses getTranslations() (Home has no
// redirect requirement, unlike articles/[slug]), which forces a
// runtime-data Suspense boundary — kept local to this route, never hoisted
// into (site)/layout.tsx (see that file's note on why).
export default function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  return (
    <Suspense>
      <HomeContent params={params} />
    </Suspense>
  );
}

async function HomeContent({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const typedLocale = locale as LocaleCode;
  const isRtl = typedLocale === "ar";
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const hoverShift = isRtl ? "group-hover:-translate-x-1" : "group-hover:translate-x-1";
  // Plain next/link with a manual prefix, not next-intl's Link: that
  // component is internally a Client Component that calls useIntlContext(),
  // which throws without a NextIntlClientProvider ancestor — one was never
  // added to (site)/layout.tsx on purpose (see its note on the article
  // redirect). Matches the shell's own established Link pattern.
  const withLocale = (path: string) => `/${typedLocale}${path.startsWith("/") ? path : `/${path}`}`;

  const [
    t,
    hero,
    values,
    whoWeAre,
    expertiseTeaser,
    strengths,
    partnersTeaser,
    closingBanner,
    services,
    partners,
    latestArticles,
    latestNews,
  ] = await Promise.all([
    getTranslations(),
    getSection<"HOME:hero">(PageKey.HOME, "hero", typedLocale),
    getSection<"HOME:values">(PageKey.HOME, "values", typedLocale),
    getSection<"HOME:whoWeAre">(PageKey.HOME, "whoWeAre", typedLocale),
    getSection<"HOME:expertiseTeaser">(PageKey.HOME, "expertiseTeaser", typedLocale),
    getSection<"HOME:strengths">(PageKey.HOME, "strengths", typedLocale),
    getSection<"HOME:partnersTeaser">(PageKey.HOME, "partnersTeaser", typedLocale),
    getSection<"HOME:closingBanner">(PageKey.HOME, "closingBanner", typedLocale),
    listServicesPublic(typedLocale),
    listPartnersPublic(),
    listLatestArticlesPublic(typedLocale, 3),
    listLatestNewsPublic(typedLocale, 3),
  ]);

  const images = await getMediaAssetsByIds(
    [whoWeAre.data.imageId, closingBanner.data.imageId].filter((id): id is string => Boolean(id)),
  );
  const whoWeAreImage = whoWeAre.data.imageId ? images[whoWeAre.data.imageId] : undefined;
  const closingImage = closingBanner.data.imageId ? images[closingBanner.data.imageId] : undefined;

  return (
    <>
      {/* ── HERO — the world's one authored entrance moment ─────────── */}
      <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
        <HeroIntro className="relative">
          <div className="absolute inset-0 flex" aria-hidden="true">
            <SpectralBandRow variant="hero" className="flex h-full w-full" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col gap-7 px-4 pt-20 pb-28 sm:px-6 sm:pt-28 sm:pb-36">
            <h1
              data-hero-heading
              className="max-w-3xl text-balance font-heading text-4xl leading-[1.05] font-semibold tracking-tight sm:text-5xl lg:text-[3.75rem]"
            >
              {hero.data.title}
            </h1>
            {hero.data.subtitle && (
              <p data-hero-subtitle className="max-w-xl text-lg text-secondary-foreground/85 sm:text-xl">
                {hero.data.subtitle}
              </p>
            )}
            {hero.data.ctaLabel && hero.data.ctaHref && (
              <div data-hero-cta className="flex flex-wrap items-center gap-4 pt-1">
                <NextLink
                  href={withLocale(hero.data.ctaHref)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/85"
                >
                  {hero.data.ctaLabel}
                  <ForwardIcon aria-hidden="true" className="size-4" />
                </NextLink>
              </div>
            )}
            <div data-hero-line className="mt-4 max-w-sm text-primary/75">
              <ContourLine className="h-8 w-full" />
            </div>
            <p data-hero-legend className="font-mono text-xs tracking-wide text-secondary-foreground/55">
              {COORDINATES[typedLocale]}
            </p>
          </div>
        </HeroIntro>
      </section>

      {/* ── VALUES — legend strip, no icons, no numbering (not a ranked
          sequence) ───────────────────────────────────────────────── */}
      {values.data.items.length > 0 && (
        <section className="border-b border-border">
          <ScrollRevealGroup className="mx-auto grid max-w-6xl gap-x-8 gap-y-10 px-4 py-16 sm:px-6 sm:py-20 md:grid-cols-4">
            {values.data.items.map((item) => (
              <div key={item.label} className="flex flex-col gap-2 border-t border-border pt-5">
                <h3 className="font-heading text-lg font-semibold text-foreground">{item.label}</h3>
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
              </div>
            ))}
          </ScrollRevealGroup>
        </section>
      )}

      {/* ── WHO WE ARE ───────────────────────────────────────────────── */}
      <section className="overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
          <ScrollReveal from="rise" className="flex flex-col gap-5">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{whoWeAre.data.heading}</h2>
            {whoWeAre.data.lead && <p className="text-lg text-muted-foreground">{whoWeAre.data.lead}</p>}
            {whoWeAre.data.body && (
              <p className="max-w-prose text-[15px] leading-relaxed text-muted-foreground">{whoWeAre.data.body}</p>
            )}
            {whoWeAre.data.linkHref && whoWeAre.data.linkLabel && (
              <NextLink
                href={withLocale(whoWeAre.data.linkHref)}
                className="group mt-2 inline-flex w-fit items-center gap-2 font-mono text-sm text-secondary transition-colors hover:text-primary"
              >
                {whoWeAre.data.linkLabel}
                <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
              </NextLink>
            )}
          </ScrollReveal>
          <ScrollReveal from="band" className="relative aspect-4/3 overflow-hidden rounded-2xl bg-muted">
            {whoWeAreImage ? (
              <CldImage
                publicId={whoWeAreImage.publicId}
                alt={pickLocalizedText(whoWeAreImage.alt, typedLocale)}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                blurDataUrl={whoWeAreImage.blurDataUrl}
              />
            ) : (
              <div className="absolute inset-0">
                <SpectralBandRow variant="quiet" className="flex h-full w-full" />
                <ContourLine className="absolute inset-x-8 bottom-8 h-10 text-secondary/40" />
              </div>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ── SERVICE TEASERS — a manifest list, not uniform icon cards;
          grows with the Service table (any number of published lines) ─ */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <ScrollReveal from="rise" className="mb-10 flex max-w-2xl flex-col gap-3">
            <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{expertiseTeaser.data.heading}</h2>
            {expertiseTeaser.data.intro && <p className="text-muted-foreground">{expertiseTeaser.data.intro}</p>}
          </ScrollReveal>

          {services.length > 0 && (
            <ScrollRevealGroup className="flex flex-col divide-y divide-border border-y border-border">
              {services.map((service, index) => (
                <NextLink
                  key={service.id}
                  href={withLocale(`/services/${service.slug}`)}
                  className="group flex flex-col gap-2 py-6 transition-colors hover:bg-background sm:flex-row sm:items-center sm:gap-8 sm:px-3"
                >
                  <span className="font-mono text-xs text-muted-foreground tabular-nums sm:w-8">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex items-center gap-3 sm:w-72">
                    {service.icon && <DynamicIcon name={service.icon as IconName} aria-hidden="true" className="size-5 text-primary" />}
                    <span className="font-heading text-lg font-semibold text-foreground">{service.title}</span>
                  </span>
                  <span className="flex-1 text-sm text-muted-foreground">{service.tagline || service.summary}</span>
                  <ForwardIcon
                    aria-hidden="true"
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${hoverShift}`}
                  />
                </NextLink>
              ))}
            </ScrollRevealGroup>
          )}

          <div className="mt-8">
            <NextLink href={withLocale("/services")} className="group inline-flex items-center gap-2 font-mono text-sm text-secondary transition-colors hover:text-primary">
              {t("site.viewAllServices")}
              <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
            </NextLink>
          </div>
        </div>
      </section>

      {/* ── STRENGTHS ────────────────────────────────────────────────── */}
      {strengths.data.items.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-[0.85fr_1.15fr] md:py-28">
            <ScrollReveal from="rise">
              <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{strengths.data.heading}</h2>
            </ScrollReveal>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {strengths.data.items.map((item) => (
                <div key={item.title} className="flex flex-col gap-1.5 border-t border-border pt-4">
                  <h3 className="font-heading text-base font-semibold text-foreground">{item.title}</h3>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </div>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── LATEST ARTICLES — hidden entirely when there are none ──────── */}
      {latestArticles.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <ScrollReveal from="rise" className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">{t("articleIndex.title")}</h2>
              <NextLink href={withLocale("/articles")} className="group hidden items-center gap-1.5 font-mono text-sm text-secondary transition-colors hover:text-primary sm:flex">
                {t("site.viewAllArticles")}
                <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
              </NextLink>
            </ScrollReveal>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
              {latestArticles.map((article) => (
                <NextLink key={article.slug} href={withLocale(`/articles/${article.slug}`)} className="group flex flex-col gap-3 border-t border-border pt-5">
                  {article.article.cover && (
                    <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-muted">
                      <CldImage
                        publicId={article.article.cover.publicId}
                        alt={pickLocalizedText(article.article.cover.alt, typedLocale)}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        blurDataUrl={article.article.cover.blurDataUrl}
                        className="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <p className="font-mono text-xs text-muted-foreground">
                    {article.publishedAt && formatDate(article.publishedAt, typedLocale)}
                    {article.readingTime ? ` · ${t("article.readingTime", { minutes: article.readingTime })}` : ""}
                  </p>
                  <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
                    {article.title}
                  </h3>
                  {article.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>}
                </NextLink>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── LATEST NEWS — cobalt band, hidden entirely when there are none ─ */}
      {latestNews.length > 0 && (
        <section className="border-t border-border bg-secondary text-secondary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
            <ScrollReveal from="rise" className="mb-10 flex items-end justify-between gap-4">
              <h2 className="font-heading text-3xl font-semibold sm:text-4xl">{t("newsIndex.title")}</h2>
              <NextLink
                href={withLocale("/actualites")}
                className="group hidden items-center gap-1.5 font-mono text-sm text-secondary-foreground/80 transition-colors hover:text-secondary-foreground sm:flex"
              >
                {t("site.viewAllNews")}
                <ForwardIcon aria-hidden="true" className={`size-4 transition-transform ${hoverShift}`} />
              </NextLink>
            </ScrollReveal>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
              {latestNews.map((item) => (
                <NextLink
                  key={item.slug}
                  href={withLocale(`/actualites/${item.slug}`)}
                  className="group flex flex-col gap-3 border-t border-secondary-foreground/20 pt-5"
                >
                  {item.news.cover && (
                    <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-secondary-foreground/10">
                      <CldImage
                        publicId={item.news.cover.publicId}
                        alt={pickLocalizedText(item.news.cover.alt, typedLocale)}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        blurDataUrl={item.news.cover.blurDataUrl}
                        className="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <p className="font-mono text-xs text-secondary-foreground/65">
                    {formatDate(item.news.eventDate ?? item.publishedAt ?? new Date(), typedLocale)}
                    {item.news.location ? ` · ${item.news.location}` : ""}
                    {item.news.externalVideoUrl ? ` · ${t("site.videoBadge")}` : ""}
                  </p>
                  <h3 className="font-heading text-lg font-semibold transition-colors group-hover:text-secondary-foreground/80">
                    {item.title}
                  </h3>
                  {item.excerpt && <p className="line-clamp-2 text-sm text-secondary-foreground/75">{item.excerpt}</p>}
                </NextLink>
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}

      {/* ── PARTNERS — renders nothing at all when there are none;
          no placeholder, no empty heading ─────────────────────────────── */}
      {partners.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <ScrollReveal from="rise" className="mb-8 flex flex-col gap-2">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{partnersTeaser.data.heading}</h2>
              {partnersTeaser.data.subheading && <p className="text-muted-foreground">{partnersTeaser.data.subheading}</p>}
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
            {partnersTeaser.data.note && <p className="mt-6 max-w-xl text-xs text-muted-foreground">{partnersTeaser.data.note}</p>}
          </div>
        </section>
      )}

      {/* ── CLOSING QUOTE ───────────────────────────────────────────────── */}
      {closingBanner.data.quote && (
        <section className="relative overflow-hidden border-t border-border bg-secondary text-secondary-foreground">
          {closingImage && (
            <div className="absolute inset-0 opacity-20">
              <CldImage
                publicId={closingImage.publicId}
                alt=""
                fill
                sizes="100vw"
                blurDataUrl={closingImage.blurDataUrl}
                className="object-cover"
              />
            </div>
          )}
          <ScrollReveal from="band" className="relative mx-auto max-w-3xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <p className="text-balance font-heading text-2xl leading-snug font-medium sm:text-3xl">{closingBanner.data.quote}</p>
          </ScrollReveal>
        </section>
      )}

      {/* ── CONTACT CTA ─────────────────────────────────────────────────── */}
      <section className="border-t border-border">
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
