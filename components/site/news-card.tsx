import NextLink from "next/link";
import { Play } from "lucide-react";
import { CldImage } from "@/components/media/cld-image";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { pickLocalizedText } from "@/lib/locale";
import { formatDate } from "@/lib/format-date";
import type { LocaleCode } from "@/lib/validation/locale";

export type NewsCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  news: {
    eventDate: Date | null;
    location: string | null;
    externalVideoUrl: string | null;
    cover: { publicId: string; blurDataUrl: string | null; alt: unknown } | null;
    _count: { media: number };
  };
};

// Same border-top row grammar as ArticleCard, distinct enough to read as
// news: date and location lead the meta
// line (articles lead with reading time instead), and a video badge marks
// items with motion — the world's "signal" color for the one thing in the
// list that isn't static.
export function NewsCard({
  item,
  locale,
  videoLabel,
}: {
  item: NewsCardData;
  locale: LocaleCode;
  videoLabel: string;
}) {
  const cover = item.news.cover;
  const hasVideo = Boolean(item.news.externalVideoUrl) || item.news._count.media > 0;
  const date = item.news.eventDate ?? item.publishedAt;

  return (
    <NextLink
      href={`/${locale}/actualites/${item.slug}`}
      className="group flex flex-col gap-3 border-t border-border pt-5"
    >
      <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-muted">
        {cover ? (
          <CldImage
            publicId={cover.publicId}
            alt={pickLocalizedText(cover.alt, locale)}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            blurDataUrl={cover.blurDataUrl}
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <SpectralBandRow variant="quiet" className="flex h-full w-full" />
        )}
        {hasVideo && (
          <span className="absolute start-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 font-mono text-[10px] tracking-wide text-primary-foreground uppercase">
            <Play aria-hidden="true" className="size-3" fill="currentColor" />
            {videoLabel}
          </span>
        )}
      </div>
      <p className="font-mono text-xs font-medium text-foreground">
        {date && formatDate(date, locale)}
        {item.news.location ? ` · ${item.news.location}` : ""}
      </p>
      <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
        {item.title}
      </h3>
      {item.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{item.excerpt}</p>}
    </NextLink>
  );
}
