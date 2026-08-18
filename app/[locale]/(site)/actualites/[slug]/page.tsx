import NextLink from "next/link";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, MapPin } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { CloudinaryVideo } from "@/components/site/cloudinary-video";
import { NewsCard } from "@/components/site/news-card";
import { ScrollRevealGroup } from "@/components/site/scroll-reveal";
import {
  getNewsBySlugForPublic,
  getNewsTranslationBySlugAnyLocale,
  getPublishedLocalesForNews,
  listPublishedNewsSlugsForStaticParams,
  listRelatedNewsPublic,
} from "@/server/queries/news";
import { pickLocalizedText } from "@/lib/locale";
import { formatDate } from "@/lib/format-date";
import { getSiteUrl } from "@/lib/site-url";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { buildArticleSchema, buildBreadcrumbSchema, jsonLdGraph, BREADCRUMB_LABELS } from "@/lib/structured-data";
import { JsonLd } from "@/components/site/json-ld";
import type { LocaleCode } from "@/lib/validation/locale";

// Code-split from the page's main chunk — both stay `ssr: true` (the
// default): the gallery grid's thumbnails and the video
// poster/thumbnail still need to be in the server-rendered HTML (image SEO,
// no-JS visitors), only their own interactive JS (Base UI's Dialog, the
// click-to-load iframe swap) is deferred to a separate chunk instead of
// shipping inline with every other client island on this route.
const GalleryLightbox = dynamic(() => import("@/components/site/gallery-lightbox").then((mod) => mod.GalleryLightbox));
const ExternalVideoEmbed = dynamic(() => import("@/components/site/external-video-embed").then((mod) => mod.ExternalVideoEmbed));

// A plain locale dictionary, not getTranslations()/messages/*.json — this
// page deliberately stays outside <Suspense> (see the note on the default
// export below) so redirect() can set a real HTTP 307, matching
// articles/[slug] and services/[slug]'s identical constraint.
const DICT: Record<
  LocaleCode,
  {
    back: string;
    gallery: string;
    more: string;
    videoBadge: string;
    playVideo: string;
    lightboxClose: string;
    lightboxPrevious: string;
    lightboxNext: string;
    lightboxOpen: string;
  }
> = {
  fr: {
    back: "Retour aux actualités",
    gallery: "Galerie",
    more: "Autres actualités",
    videoBadge: "Vidéo",
    playVideo: "Lire la vidéo",
    lightboxClose: "Fermer",
    lightboxPrevious: "Image précédente",
    lightboxNext: "Image suivante",
    lightboxOpen: "Agrandir l'image",
  },
  en: {
    back: "Back to news",
    gallery: "Gallery",
    more: "More news",
    videoBadge: "Video",
    playVideo: "Play video",
    lightboxClose: "Close",
    lightboxPrevious: "Previous image",
    lightboxNext: "Next image",
    lightboxOpen: "Open image",
  },
  ar: {
    back: "العودة إلى الأخبار",
    gallery: "معرض الصور",
    more: "أخبار أخرى",
    videoBadge: "فيديو",
    playVideo: "تشغيل الفيديو",
    lightboxClose: "إغلاق",
    lightboxPrevious: "الصورة السابقة",
    lightboxNext: "الصورة التالية",
    lightboxOpen: "تكبير الصورة",
  },
};

// Real published slugs — follows listPublishedNewsSlugsForStaticParams,
// same "always at least one value" rule as every other generateStaticParams
// on the public site (Cache Components rejects an empty array).
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const slugs = await listPublishedNewsSlugsForStaticParams(params.locale as LocaleCode);
  return slugs.map((slug) => ({ slug }));
}

async function loadNews(locale: LocaleCode, slug: string) {
  const news = await getNewsBySlugForPublic(locale, slug);
  if (news) return news;

  // Redirect-first (constraint 2), not notFound() — an unpublished or
  // unknown news slug sends the visitor to a locale that has it, or to the
  // actualites index if none does, exactly like services/[slug]'s resolved
  // shape for the same DYNAMIC_SERVER_USAGE crash under Cache Components.
  const fallback = await getNewsTranslationBySlugAnyLocale(slug);
  if (fallback) redirect(`/${fallback.locale}/actualites/${fallback.slug}`);
  redirect(`/${locale}/actualites`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const news = await getNewsBySlugForPublic(locale as LocaleCode, slug);
  if (!news) return {};

  const availableLocales = await getPublishedLocalesForNews(news.id);
  const languages = Object.fromEntries(availableLocales.map((entry) => [entry.locale, `/${entry.locale}/actualites/${entry.slug}`]));
  const frEntry = availableLocales.find((entry) => entry.locale === "fr");

  return {
    title: news.metaTitle || news.title,
    description: news.metaDescription || news.excerpt || undefined,
    alternates: {
      canonical: `/${locale}/actualites/${slug}`,
      languages: frEntry ? { ...languages, "x-default": `/fr/actualites/${frEntry.slug}` } : languages,
    },
  };
}

type PageProps = { params: Promise<{ locale: string; slug: string }> };

// Deliberately NOT Suspense-wrapped — same reasoning as articles/[slug]:
// redirect() inside a streamed boundary degrades to a client-side
// meta-refresh instead of a real HTTP 307.
export default async function NewsDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const t = DICT[typedLocale];
  const isRtl = typedLocale === "ar";
  const news = await loadNews(typedLocale, slug);

  const [siteUrl, moreNews] = await Promise.all([
    getSiteUrl(),
    listRelatedNewsPublic({ locale: typedLocale, newsId: news.id }),
  ]);
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  // eventDate is the editorial truth for an event; publishedAt is the
  // fallback for a plain announcement. Rendering nothing when both are absent
  // beats the previous `?? new Date()`, which silently stamped today's date
  // onto an item that had never actually been dated.
  const displayDate = news.eventDate ?? news.publishedAt;

  const imageItems = news.media.filter((item) => item.media.type === "IMAGE");
  const videoItems = news.media.filter((item) => item.media.type === "VIDEO");
  const hasGallery = imageItems.length > 0 || videoItems.length > 0 || Boolean(news.externalVideoUrl);

  const trimmedSiteUrl = siteUrl.replace(/\/$/, "");
  const canonicalUrl = `${trimmedSiteUrl}/${typedLocale}/actualites/${slug}`;
  const breadcrumbLabels = BREADCRUMB_LABELS[typedLocale];
  const newsSchema = buildArticleSchema({
    type: "NewsArticle",
    siteUrl: trimmedSiteUrl,
    url: canonicalUrl,
    headline: news.title,
    description: news.metaDescription || news.excerpt,
    imageUrl: news.cover ? cloudinaryImageUrl(news.cover.publicId, { width: 1200 }) : undefined,
    datePublished: news.publishedAt,
    dateModified: news.updatedAt,
    authorNames: [],
  });
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: breadcrumbLabels.home, url: `${trimmedSiteUrl}/${typedLocale}` },
    { name: breadcrumbLabels.actualites, url: `${trimmedSiteUrl}/${typedLocale}/actualites` },
    { name: news.title, url: canonicalUrl },
  ]);

  return (
    <article className="flex flex-col pb-20">
      <JsonLd data={jsonLdGraph([newsSchema, breadcrumbSchema])} />
      {/* pb-12 keeps the section hairline off the cover image, which it
          previously sat flush against. */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pt-10 pb-12 sm:px-6">
          {/* No per-item locale switcher here — the header's LanguageSwitcher is
              the single place language is changed; generateMetadata still emits
              the hreflang alternates. */}
          <NextLink
            href={`/${typedLocale}/actualites`}
            className="flex w-fit items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <BackIcon aria-hidden="true" className="size-3.5" />
            {t.back}
          </NextLink>

          {/* Title first, then the date/location line — the same order
              articles/[slug] uses, and it keeps the metadata from reading as a
              decorative eyebrow above the headline. */}
          <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {news.title}
          </h1>

          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-sm font-medium text-secondary">
            {displayDate && (
              <time dateTime={displayDate.toISOString()}>{formatDate(displayDate, typedLocale)}</time>
            )}
            {news.location && (
              <span className="flex items-center gap-1.5">
                <MapPin aria-hidden="true" className="size-3.5" />
                {news.location}
              </span>
            )}
          </p>

          <div className="relative aspect-21/9 overflow-hidden rounded-2xl bg-muted">
            {news.cover ? (
              <CldImage
                publicId={news.cover.publicId}
                alt={pickLocalizedText(news.cover.alt, typedLocale)}
                fill
                sizes="(min-width: 1024px) 900px, 100vw"
                blurDataUrl={news.cover.blurDataUrl}
                className="object-cover"
              />
            ) : (
              <SpectralBandRow variant="quiet" className="flex h-full w-full" />
            )}
          </div>
        </div>
      </header>

      {/* contentHtml is sanitized server-side at save time (server/services/content.ts).
          The max-w-4xl track matches the header's, and the prose measure is
          constrained *inside* it: centring max-w-prose on the page instead —
          as this did — pushed the body text ~130px right of the title and
          cover it belongs to, breaking the page's vertical spine. */}
      <div className="mx-auto w-full max-w-4xl px-4 pt-12 sm:px-6">
        <div className="article-content max-w-prose" dangerouslySetInnerHTML={{ __html: news.contentHtml }} />
      </div>

      {/* A news item with no media renders with no gallery region at
          all — no heading, no empty container. */}
      {hasGallery && (
        <section className="mx-auto w-full max-w-4xl px-4 pt-16 sm:px-6">
          <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">{t.gallery}</h2>

          {(videoItems.length > 0 || news.externalVideoUrl) && (
            <div className="mb-8 flex flex-col gap-8">
              {videoItems.map((item) => {
                const caption = pickLocalizedText(item.caption, typedLocale);
                return (
                  <figure key={item.id} className="flex flex-col gap-2">
                    <CloudinaryVideo publicId={item.media.publicId} format={item.media.format} alt={pickLocalizedText(item.media.alt, typedLocale)} />
                    {caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
                  </figure>
                );
              })}
              {news.externalVideoUrl && (
                <ExternalVideoEmbed url={news.externalVideoUrl} title={news.title} playLabel={t.playVideo} />
              )}
            </div>
          )}

          {imageItems.length > 0 && (
            <GalleryLightbox
              locale={typedLocale}
              labels={{ close: t.lightboxClose, previous: t.lightboxPrevious, next: t.lightboxNext, openImage: t.lightboxOpen }}
              images={imageItems.map((item) => ({
                publicId: item.media.publicId,
                blurDataUrl: item.media.blurDataUrl,
                alt: pickLocalizedText(item.media.alt, typedLocale),
                caption: pickLocalizedText(item.caption, typedLocale) || undefined,
              }))}
            />
          )}
        </section>
      )}

      {/* The page used to stop dead at the last paragraph, leaving the back
          link at the very top as the only way onward. */}
      {moreNews.length > 0 && (
        <section className="mt-20 border-t border-border">
          <div className="mx-auto max-w-6xl px-4 pt-14 sm:px-6">
            <h2 className="mb-8 font-heading text-2xl font-semibold text-foreground">{t.more}</h2>
            <ScrollRevealGroup className="grid gap-x-8 gap-y-10 sm:grid-cols-3">
              {moreNews.map((item) => (
                <NewsCard key={item.slug} item={item} locale={typedLocale} videoLabel={t.videoBadge} />
              ))}
            </ScrollRevealGroup>
          </div>
        </section>
      )}
    </article>
  );
}
