import { mergeAttributes, type Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TableOfContents from "@tiptap/extension-table-of-contents";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { slugify } from "@/lib/slug";

// Widths cover the sticky-ToC desktop reading column down to a single mobile
// column; article covers use a different set (media picker), this is body
// content only. See architecture-full.md §5 ("Inline images"). Exported so
// the client-only NodeView (image-node-view.tsx) can build an identical
// srcset for the live editing view without duplicating the width list.
export const RESPONSIVE_WIDTHS = [480, 768, 1024, 1600, 2400];

// Logical (start/end), not left/right — the same saved article can render
// under dir="ltr" (FR/EN) or dir="rtl" (AR), and img-align-start/-end (see
// .article-content in app/globals.css) resolve to the correct physical side
// via CSS `float: inline-start/inline-end`, driven by the ancestor's `dir`.
const ALIGN_VALUES = ["start", "center", "end"] as const;
const WIDTH_PERCENT_VALUES = [25, 50, 75, 100] as const;
export type ImageAlign = (typeof ALIGN_VALUES)[number];
export type ImageWidthPercent = (typeof WIDTH_PERCENT_VALUES)[number];

function alignClass(align: unknown): ImageAlign {
  return (ALIGN_VALUES as readonly string[]).includes(align as string) ? (align as ImageAlign) : "center";
}
function widthPercentClass(widthPercent: unknown): ImageWidthPercent {
  const n = Number(widthPercent);
  return (WIDTH_PERCENT_VALUES as readonly number[]).includes(n) ? (n as ImageWidthPercent) : 100;
}

// Extends the stock Image node with the fields architecture-full.md §5 says
// the JSON must carry (`publicId`, `width`, `height`) and renders a
// `srcset`/`sizes` `<img>` from them at save time — the "responsive markup"
// step of the content pipeline lives here rather than as a post-process pass,
// since generateHTML already calls each node's own renderHTML. `align` and
// `widthPercent` are display-only (a closed set of classes, not arbitrary
// style) so server/services/content.ts's sanitizer allow-list can stay
// closed; `draggable: true` lets the client NodeView (components/editor/
// image-node-view.tsx) support reposition-by-drag — it's a schema-level flag
// only, inert here and in the static-rendered HTML.
export const ResponsiveImage = Image.extend({
  name: "image",
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      publicId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-public-id"),
        renderHTML: (attributes) => (attributes.publicId ? { "data-public-id": attributes.publicId } : {}),
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute("width"),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute("height"),
      },
      align: {
        default: "center",
        parseHTML: (element) => alignClass(element.className.match(/img-align-(\w+)/)?.[1]),
      },
      widthPercent: {
        default: 100,
        parseHTML: (element) => widthPercentClass(element.className.match(/img-w-(\d+)/)?.[1]),
      },
    };
  },
  renderHTML({ node, HTMLAttributes }) {
    const publicId = node.attrs.publicId as string | null;
    const displayClass = `img-align-${alignClass(node.attrs.align)} img-w-${widthPercentClass(node.attrs.widthPercent)}`;

    if (!publicId) {
      // No Cloudinary asset behind this node (shouldn't happen via the editor's
      // own upload path) — fall back to a plain <img> rather than drop it.
      return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: displayClass })];
    }

    const srcset = RESPONSIVE_WIDTHS.map((width) => `${cloudinaryImageUrl(publicId, { width })} ${width}w`).join(
      ", ",
    );

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, {
        src: cloudinaryImageUrl(publicId, { width: 1600 }),
        srcset,
        sizes: "(min-width: 1024px) 720px, 100vw",
        alt: node.attrs.alt ?? "",
        width: node.attrs.width ?? undefined,
        height: node.attrs.height ?? undefined,
        loading: "lazy",
        class: displayClass,
      }),
    ];
  },
});

// Shared by the client editor (components/editor/article-editor.tsx) and the
// server content pipeline (server/services/content.ts) — generateHTML must
// see the same extension set the doc was authored with. Pure module, no
// server-only imports, so it's safe in both bundles. `imageExtension` lets
// the client editor swap in a NodeView-carrying variant (image-node-view.tsx)
// without pulling @tiptap/react into this shared, server-reachable module —
// the NodeView is an editing-UI concern only and never affects the schema or
// the server's static-rendered HTML.
export function createEditorExtensions({
  placeholder,
  imageExtension,
}: { placeholder?: string; imageExtension?: typeof ResponsiveImage } = {}): Extensions {
  return [
    StarterKit.configure({
      // The article title is the page's h1 (rendered outside the editor) —
      // body headings start at h2 to keep one h1 per page (error-handling.md /
      // architecture-full.md §13).
      heading: { levels: [2, 3, 4] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      },
    }),
    (imageExtension ?? ResponsiveImage).configure({ inline: false, allowBase64: false }),
    TableKit.configure({ table: { resizable: false } }),
    Superscript,
    Subscript,
    Youtube.configure({ nocookie: true, HTMLAttributes: { class: "aspect-video w-full rounded-lg" } }),
    Placeholder.configure({ placeholder: placeholder ?? "Rédigez le corps de l'article…" }),
    CharacterCount,
    TableOfContents.configure({ getId: (textContent) => slugify(textContent) || "section" }),
  ];
}
