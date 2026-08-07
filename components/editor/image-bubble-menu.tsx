"use client";

import { useState } from "react";
import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { AlignCenter, AlignLeft, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { ImageAlign, ImageWidthPercent } from "@/components/editor/extensions";

const WIDTH_OPTIONS: ImageWidthPercent[] = [25, 50, 75, 100];
// Labels are direction-neutral ("début"/"fin", not "gauche"/"droite"): the
// value stored is logical (start/end — see extensions.ts) and the same
// article can later be viewed under dir="rtl" (Arabic tab), where "start"
// renders on the right. The icons are purely a visual hint for this
// editor's own chrome, which stays LTR regardless of the content's locale.
const ALIGN_OPTIONS: { value: ImageAlign; label: string; icon: typeof AlignLeft }[] = [
  { value: "start", label: "Aligner au début", icon: AlignLeft },
  { value: "center", label: "Centrer", icon: AlignCenter },
  { value: "end", label: "Aligner à la fin", icon: AlignRight },
];

// One floating menu per selected image — width, alignment, and alt text all
// live here instead of the fixed toolbar, since they only make sense once an
// image is selected. Alt text is editable after insert (not just once, at
// insertion time) because WCAG 2.2 AA is a hard product requirement
// (PRODUCT.md → Accessibility & Inclusion).
export function ImageBubbleMenu({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor || ctx.editor.isDestroyed || !ctx.editor.isActive("image")) {
        return { active: false, pos: -1, align: "center" as ImageAlign, widthPercent: 100 as ImageWidthPercent, alt: "" };
      }
      const attrs = ctx.editor.getAttributes("image");
      return {
        active: true,
        pos: ctx.editor.state.selection.from,
        align: (attrs.align as ImageAlign | undefined) ?? "center",
        widthPercent: (attrs.widthPercent as ImageWidthPercent | undefined) ?? 100,
        alt: (attrs.alt as string | undefined) ?? "",
      };
    },
  });

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="imageBubbleMenu"
      shouldShow={({ editor: bubbleEditor }) => bubbleEditor.isActive("image")}
      options={{ placement: "top", offset: 10 }}
    >
      <div className="flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-md">
        <div role="group" aria-label="Largeur de l'image" className="flex items-center gap-0.5">
          {WIDTH_OPTIONS.map((width) => (
            <Button
              key={width}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={state.widthPercent === width}
              className={cn(
                "font-mono text-xs",
                state.widthPercent === width && "bg-accent text-accent-foreground",
              )}
              onClick={() => editor.chain().focus().updateAttributes("image", { widthPercent: width }).run()}
            >
              {width}%
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div role="group" aria-label="Alignement de l'image" className="flex items-center gap-0.5">
          {ALIGN_OPTIONS.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={label}
              title={label}
              aria-pressed={state.align === value}
              className={cn(state.align === value && "bg-accent text-accent-foreground")}
              onClick={() => editor.chain().focus().updateAttributes("image", { align: value }).run()}
            >
              <Icon aria-hidden="true" className="size-4" />
            </Button>
          ))}
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        {/* Keyed on the selected image's position: switching to a different
            image remounts this field so its draft resets to that image's own
            alt text, instead of syncing local state from a prop in an effect. */}
        <ImageAltField key={state.pos} editor={editor} initialAlt={state.alt} />

        <Separator orientation="vertical" className="mx-1 h-5" />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Supprimer l'image"
          title="Supprimer l'image"
          onClick={() => editor.chain().focus().deleteSelection().run()}
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </Button>
      </div>
    </BubbleMenu>
  );
}

function ImageAltField({ editor, initialAlt }: { editor: Editor; initialAlt: string }) {
  const [draft, setDraft] = useState(initialAlt);

  function commit() {
    if (draft !== initialAlt) editor.chain().focus().updateAttributes("image", { alt: draft }).run();
  }

  return (
    <Input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commit();
        }
      }}
      placeholder="Texte alternatif"
      aria-label="Texte alternatif de l'image"
      className="h-7 w-36 text-xs"
    />
  );
}
