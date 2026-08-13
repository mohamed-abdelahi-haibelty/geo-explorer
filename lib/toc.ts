export type TocHeading = { id: string; level: 2 | 3 | 4; text: string };

// contentHtml is sanitized server-side at save time (server/services/content.ts),
// which is also what stamps h2–h4 with a stable `id` via generateTocIds — this
// just reads that id/text pair back out for the sticky sidebar nav. Headings a
// writer never gave real text (rare, but possible with an empty heading node)
// are dropped rather than rendered as a blank link.
export function extractHeadings(html: string): TocHeading[] {
  const matches = html.matchAll(/<h([234])\b[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g);
  const headings: TocHeading[] = [];
  for (const [, level, id, inner] of matches) {
    const text = inner
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 0) headings.push({ id, level: Number(level) as 2 | 3 | 4, text });
  }
  return headings;
}
