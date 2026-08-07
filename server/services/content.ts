import sanitizeHtml from "sanitize-html";
import type { JSONContent } from "@tiptap/core";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { generateTocIds } from "@tiptap/extension-table-of-contents";
import { createEditorExtensions } from "@/components/editor/extensions";
import { computeReadingTime } from "@/lib/reading-time";

// Explicit allow-list — anything not named here is stripped, regardless of
// what the editor's own schema would otherwise permit. `renderToHTMLString`
// only ever emits tags the configured extensions produce, but this is the
// second, independent gate error-handling.md and Task 04 step 1 both call for.
const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "strong",
  "em",
  "s",
  "u",
  "sup",
  "sub",
  "a",
  "blockquote",
  "code",
  "pre",
  "h2",
  "h3",
  "h4",
  "ul",
  "ol",
  "li",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "iframe",
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "target", "rel"],
  img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "data-public-id", "class"],
  h2: ["id", "data-toc-id"],
  h3: ["id", "data-toc-id"],
  h4: ["id", "data-toc-id"],
  div: ["data-youtube-video", "class"],
  iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title", "class"],
  th: ["colspan", "rowspan", "colwidth"],
  td: ["colspan", "rowspan", "colwidth"],
};

// colspan/rowspan are single integers; colwidth (set by merge/split and, if
// resizable is ever turned on, column dragging) is a comma-joined list of
// per-column pixel widths — Tiptap's own serialization of the array attribute
// (see @tiptap/extension-table's parseColwidth). allowedAttributes only
// filters by attribute *name*, so a malformed value would otherwise pass
// through into contentHtml verbatim; reject anything that isn't digits (and
// commas, for colwidth) rather than trying to merge/relayout it.
const NUMERIC_ATTR = /^\d+$/;
const COLWIDTH_ATTR = /^\d+(,\d+)*$/;

function sanitizeTableCellAttribs(tagName: string, attribs: sanitizeHtml.Attributes): sanitizeHtml.Tag {
  const attribsCopy = { ...attribs };
  if (attribsCopy.colspan !== undefined && !NUMERIC_ATTR.test(attribsCopy.colspan)) delete attribsCopy.colspan;
  if (attribsCopy.rowspan !== undefined && !NUMERIC_ATTR.test(attribsCopy.rowspan)) delete attribsCopy.rowspan;
  if (attribsCopy.colwidth !== undefined && !COLWIDTH_ATTR.test(attribsCopy.colwidth)) delete attribsCopy.colwidth;
  return { tagName, attribs: attribsCopy };
}

// A closed vocabulary, not an open `class` attribute — img is the only tag
// where `class` carries editor-authored display state (align/width, see
// components/editor/extensions.ts ResponsiveImage.renderHTML) rather than a
// fixed extension-owned className, so it needs its own allow-list to avoid
// admitting arbitrary Tailwind utilities already compiled into this bundle.
const ALLOWED_IMG_CLASSES = [
  "img-align-start",
  "img-align-center",
  "img-align-end",
  "img-w-25",
  "img-w-50",
  "img-w-75",
  "img-w-100",
];

export function processContent(
  contentJson: JSONContent,
  providedExcerpt?: string | null,
): { contentHtml: string; plainText: string; readingTime: number; excerpt: string } {
  const extensions = createEditorExtensions();
  const docWithTocIds = generateTocIds(contentJson, extensions);

  const rawHtml = renderToHTMLString({ content: docWithTocIds, extensions });

  const sanitized = sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedClasses: { img: ALLOWED_IMG_CLASSES },
    allowedSchemes: ["http", "https", "mailto"],
    allowedIframeHostnames: ["www.youtube-nocookie.com"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
      td: sanitizeTableCellAttribs,
      th: sanitizeTableCellAttribs,
    },
  });
  // generateTocIds only de-dupes against ids a heading already had — two
  // headings with identical text in the same save both get the same fresh id.
  // Fix that up on the final string rather than making getId stateful, which
  // would also affect the editor's own live (reactive, per-keystroke) plugin.
  const contentHtml = deduplicateHeadingIds(sanitized);

  const plainText = extractPlainText(docWithTocIds).replace(/[ \t]+/g, " ").trim();
  const readingTime = computeReadingTime(plainText);
  const excerpt = providedExcerpt?.trim() || autoExcerpt(plainText);

  return { contentHtml, plainText, readingTime, excerpt };
}

const BLOCK_NODE_TYPES = new Set([
  "paragraph",
  "heading",
  "listItem",
  "blockquote",
  "codeBlock",
  "tableCell",
  "tableHeader",
  "tableRow",
]);

function extractPlainText(node: JSONContent): string {
  if (node.text) return node.text;
  if (!node.content) return "";
  const inner = node.content.map(extractPlainText).join(" ");
  return node.type && BLOCK_NODE_TYPES.has(node.type) ? `${inner}\n` : inner;
}

function deduplicateHeadingIds(html: string): string {
  const seen = new Map<string, number>();
  return html.replace(/<(h[234])\b([^>]*)>/g, (fullMatch, tag: string, attrs: string) => {
    const idMatch = attrs.match(/\bid="([^"]*)"/);
    if (!idMatch) return fullMatch;
    const id = idMatch[1];
    const count = seen.get(id) ?? 0;
    seen.set(id, count + 1);
    if (count === 0) return fullMatch;
    const finalId = `${id}-${count + 1}`;
    const newAttrs = attrs
      .replace(/\bid="[^"]*"/, `id="${finalId}"`)
      .replace(/\bdata-toc-id="[^"]*"/, `data-toc-id="${finalId}"`);
    return `<${tag}${newAttrs}>`;
  });
}

const EXCERPT_MAX_LENGTH = 200;

function autoExcerpt(plainText: string, max = EXCERPT_MAX_LENGTH): string {
  const normalized = plainText.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const truncated = normalized.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : max).trimEnd()}…`;
}
