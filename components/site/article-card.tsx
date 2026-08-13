import NextLink from "next/link";
import { CldImage } from "@/components/media/cld-image";
import { SpectralBandRow } from "@/components/site/spectral-bands";
import { pickLocalizedText } from "@/lib/locale";
import { formatDate } from "@/lib/format-date";
import type { LocaleCode } from "@/lib/validation/locale";

export type ArticleCardData = {
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingTime: number;
  article: {
    cover: { publicId: string; blurDataUrl: string | null; alt: unknown } | null;
    authors: { author: { id: string; name: string } }[];
  };
};

// The one card shape every article grid on the public site renders through
// (index, tag filter, author profile, related-articles) — a border-top row
// with an image, not a boxed/shadowed card, matching the home page's own
// "LATEST ARTICLES" teaser grid rather than inventing a second
// grammar for the same content type.
export function ArticleCard({
  article,
  locale,
  readingTimeLabel,
}: {
  article: ArticleCardData;
  locale: LocaleCode;
  readingTimeLabel: (minutes: number) => string;
}) {
  const cover = article.article.cover;
  const firstAuthor = article.article.authors[0]?.author.name;

  return (
    <NextLink
      href={`/${locale}/articles/${article.slug}`}
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
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        {article.publishedAt && formatDate(article.publishedAt, locale)}
        {article.readingTime ? ` · ${readingTimeLabel(article.readingTime)}` : ""}
      </p>
      <h3 className="font-heading text-lg font-semibold text-foreground transition-colors group-hover:text-secondary">
        {article.title}
      </h3>
      {article.excerpt && <p className="line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p>}
      {firstAuthor && <p className="mt-auto font-mono text-xs text-muted-foreground">{firstAuthor}</p>}
    </NextLink>
  );
}
