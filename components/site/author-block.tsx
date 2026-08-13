import NextLink from "next/link";
import { CldImage } from "@/components/media/cld-image";
import { pickLocalizedText } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type AuthorRow = {
  author: {
    id: string;
    slug: string;
    name: string;
    title: unknown;
    photo: { publicId: string; blurDataUrl: string | null; alt: unknown } | null;
  };
};

// Article detail's author strip — links each author to /auteurs/[slug],
// showing photo, name, and pickLocalizedText(title), one row per author
// since an article can carry several.
export function AuthorBlock({ authors, locale }: { authors: AuthorRow[]; locale: LocaleCode }) {
  return (
    <ul className="flex flex-wrap gap-5">
      {authors.map(({ author }) => (
        <li key={author.id}>
          <NextLink href={`/${locale}/auteurs/${author.slug}`} className="group flex items-center gap-3">
            {author.photo ? (
              <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
                <CldImage
                  publicId={author.photo.publicId}
                  alt=""
                  fill
                  sizes="40px"
                  blurDataUrl={author.photo.blurDataUrl}
                />
              </div>
            ) : (
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs text-muted-foreground">
                {initials(author.name)}
              </span>
            )}
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground transition-colors group-hover:text-secondary">{author.name}</span>
              {pickLocalizedText(author.title, locale) && (
                <span className="font-mono text-xs text-muted-foreground">{pickLocalizedText(author.title, locale)}</span>
              )}
            </span>
          </NextLink>
        </li>
      ))}
    </ul>
  );
}
