import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/lib/validation/locale";

function buildPageList(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  const list: (number | "ellipsis")[] = [1];
  if (left > 2) list.push("ellipsis");
  for (let i = left; i <= right; i++) list.push(i);
  if (right < total - 1) list.push("ellipsis");
  if (total > 1) list.push(total);
  return list;
}

// The public site's one shared numbered-pagination control — pagination,
// tag filter, and search all compose in the URL and stay shareable; every
// other query param on the page (tag, q) is preserved across page links,
// only `page` changes. Mono/tabular-nums digits, matching
// the world's legend-key vocabulary rather than the admin's shadcn
// pagination component.
export function PaginationNav({
  locale,
  basePath,
  page,
  pageCount,
  searchParams = {},
  prevLabel,
  nextLabel,
}: {
  locale: LocaleCode;
  basePath: string;
  page: number;
  pageCount: number;
  searchParams?: Record<string, string | undefined>;
  prevLabel: string;
  nextLabel: string;
}) {
  if (pageCount <= 1) return null;

  const isRtl = locale === "ar";
  const PrevIcon = isRtl ? ArrowRight : ArrowLeft;
  const NextIcon = isRtl ? ArrowLeft : ArrowRight;

  function hrefFor(targetPage: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages = buildPageList(page, pageCount);

  return (
    <nav aria-label="pagination" className="flex items-center justify-between gap-4 font-mono text-sm">
      {page > 1 ? (
        <NextLink href={hrefFor(page - 1)} className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
          <PrevIcon aria-hidden="true" className="size-3.5" />
          <span className="hidden sm:inline">{prevLabel}</span>
        </NextLink>
      ) : (
        <span aria-hidden="true" />
      )}

      <ul className="flex items-center gap-1">
        {pages.map((entry, index) =>
          entry === "ellipsis" ? (
            <li key={`ellipsis-${index}`} className="px-1.5 text-muted-foreground" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <NextLink
                href={hrefFor(entry)}
                aria-current={entry === page ? "page" : undefined}
                className={cn(
                  "flex size-8 items-center justify-center rounded-lg tabular-nums transition-colors",
                  entry === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {entry}
              </NextLink>
            </li>
          ),
        )}
      </ul>

      {page < pageCount ? (
        <NextLink href={hrefFor(page + 1)} className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
          <span className="hidden sm:inline">{nextLabel}</span>
          <NextIcon aria-hidden="true" className="size-3.5" />
        </NextLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </nav>
  );
}
