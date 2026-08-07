"use client";

import { GripVertical } from "lucide-react";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { cloudinaryImageUrl } from "@/lib/cloudinary-url";
import { ResponsiveImage, RESPONSIVE_WIDTHS, type ImageAlign, type ImageWidthPercent } from "@/components/editor/extensions";
import { cn } from "@/lib/utils";

// The wrapper carries the align/width box (plain Tailwind utilities, not the
// img-align-*/img-w-* classes extensions.ts renders into saved HTML) purely
// so the drag-handle overlay has something to position against — the final
// saved output is a bare <img>, with no wrapper at all (see
// ResponsiveImage.renderHTML). Sizing/float behavior matches either way.
export function ImageNodeView({ node, selected }: ReactNodeViewProps) {
  const publicId = node.attrs.publicId as string | null;
  const align = (node.attrs.align as ImageAlign | undefined) ?? "center";
  const widthPercent = (node.attrs.widthPercent as ImageWidthPercent | undefined) ?? 100;
  const alt = (node.attrs.alt as string | undefined) ?? "";

  const src = publicId ? cloudinaryImageUrl(publicId, { width: 1600 }) : (node.attrs.src as string | undefined);
  const srcSet = publicId
    ? RESPONSIVE_WIDTHS.map((width) => `${cloudinaryImageUrl(publicId, { width })} ${width}w`).join(", ")
    : undefined;

  return (
    <NodeViewWrapper
      contentEditable={false}
      draggable="true"
      className={cn(
        "group relative",
        // Margin sits on the inline-end side of a start-float and the
        // inline-start side of an end-float — the side facing the text —
        // via Tailwind's logical ms-*/me-* utilities. The float direction
        // itself (style, below) resolves against the wrapper's inherited
        // `dir`, so this reads correctly for both LTR (FR/EN) and RTL (AR).
        align === "start" && "me-6 mb-4",
        align === "end" && "ms-6 mb-4",
        align === "center" && "clear-both mx-auto",
      )}
      style={{
        width: `${widthPercent}%`,
        float: align === "start" ? "inline-start" : align === "end" ? "inline-end" : undefined,
      }}
    >
      <span
        contentEditable={false}
        draggable="true"
        data-drag-handle=""
        title="Glisser pour déplacer l'image"
        className={cn(
          "absolute top-1.5 left-1.5 z-10 flex size-6 cursor-grab items-center justify-center rounded-md bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100",
          selected && "opacity-100",
        )}
      >
        <GripVertical aria-hidden="true" className="size-3.5" />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- already-transformed Cloudinary derivative, not an optimizable next/image src */}
      <img
        src={src}
        srcSet={srcSet}
        sizes="(min-width: 1024px) 720px, 100vw"
        alt={alt}
        width={(node.attrs.width as number | null) ?? undefined}
        height={(node.attrs.height as number | null) ?? undefined}
        draggable={false}
        className={cn(
          "block w-full rounded-lg",
          selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        )}
      />
    </NodeViewWrapper>
  );
}

// Client-only variant of the shared ResponsiveImage extension (extensions.ts
// stays a pure, server-reachable module — see the comment on
// createEditorExtensions there). Only the editor passes this in; the server
// content pipeline uses the plain ResponsiveImage, since addNodeView is an
// editing-UI concern the static renderer never looks at.
export const DraggableResponsiveImage = ResponsiveImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
