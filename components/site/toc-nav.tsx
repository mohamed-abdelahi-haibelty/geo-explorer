import type { TocHeading } from "@/lib/toc";

// Sticky sidebar built from the headings Tiptap's generateTocIds already
// stamped into contentHtml at save time (server/services/content.ts) — no
// separate outline data to keep in sync with the article body.
export function TocNav({ headings, label }: { headings: TocHeading[]; label: string }) {
  if (headings.length === 0) return null;

  return (
    <nav aria-label={label} className="flex flex-col gap-3 border-s border-border ps-4 lg:sticky lg:top-24">
      <p className="font-mono text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
      <ul className="flex flex-col gap-2 text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingInlineStart: `${(heading.level - 2) * 0.75}rem` }}>
            <a href={`#${heading.id}`} className="text-muted-foreground transition-colors hover:text-secondary">
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
