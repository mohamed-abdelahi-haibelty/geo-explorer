"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { createEditorExtensions } from "@/components/editor/extensions";
import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { ImageBubbleMenu } from "@/components/editor/image-bubble-menu";
import { TableBubbleMenu } from "@/components/editor/table-bubble-menu";
import { DraggableResponsiveImage } from "@/components/editor/image-node-view";

export type ArticleEditorHandle = {
  getJSON: () => JSONContent;
  isEmpty: () => boolean;
  wordCount: () => number;
  setContent: (content: JSONContent) => void;
};

const EMPTY_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// Loaded exclusively via next/dynamic({ ssr: false }) from the article form —
// Tiptap must never reach a (site) bundle.
const ArticleEditor = forwardRef<
  ArticleEditorHandle,
  { initialContent: JSONContent | null; onDirty?: () => void; disabled?: boolean; dir?: "ltr" | "rtl" }
>(function ArticleEditor({ initialContent, onDirty, disabled = false, dir = "ltr" }, ref) {
  // `immediatelyRender: true` constructs the editor synchronously during
  // render; setting the initial content fires Tiptap's own `update` event as
  // part of that construction, before this component has committed — calling
  // `onDirty` (→ the parent form's setState) from inside that first event
  // logs "Can't perform a React state update on a component that hasn't
  // mounted yet" and arms the 30s autosave timer on a freshly created,
  // untouched article/news item for no reason. Same root cause as the
  // setEditable guard below (a spurious Tiptap-internal event, not a genuine
  // user edit) — `onCreate` fires once the construction settles, so only
  // updates after that count as "dirty".
  const createdRef = useRef(false);
  const editor = useEditor({
    extensions: createEditorExtensions({ imageExtension: DraggableResponsiveImage }),
    content: initialContent ?? EMPTY_DOC,
    editable: !disabled,
    immediatelyRender: true,
    onCreate: () => {
      createdRef.current = true;
    },
    onUpdate: () => {
      if (createdRef.current) onDirty?.();
    },
    editorProps: {
      attributes: {
        // Capped at the same max-w-2xl the published article body renders at
        // (app/apercu/voir/[id]/page.tsx) — otherwise 100%-width images and
        // headings look bigger here than they'll actually be once published,
        // since this column would default to the full form-panel width.
        class: "article-content mx-auto max-w-2xl px-4 py-3 min-h-[420px] focus:outline-none",
        // `dir` on the content root only — the toolbar/chrome around it
        // stays LTR always (admin is French-only). image-node-view.tsx's
        // `float: inline-start/inline-end` resolves against this inherited
        // direction, so no separate RTL branching is needed there.
        dir,
      },
    },
  });

  // Tiptap's setEditable() emits an 'update' event even when the value isn't
  // actually changing — calling it unconditionally on mount (editable already
  // matches !disabled from the constructor options above) would fire onDirty
  // on a freshly opened, untouched form. Only sync it on genuine changes.
  const editableRef = useRef(!disabled);
  useEffect(() => {
    if (!editor || editableRef.current === !disabled) return;
    editableRef.current = !disabled;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  useImperativeHandle(
    ref,
    () => ({
      // ProseMirror builds node/mark `attrs` as null-prototype objects
      // (see prosemirror-model's computeAttrs) and editor.getJSON() attaches
      // them as-is. Next's Server Action argument serializer treats a
      // non-plain-prototype object as unserializable and swaps it for an
      // opaque reference, which then throws the moment the server pipeline
      // reads any attribute (link href, heading level, image size, table
      // colspan, …) — round-tripping through JSON.stringify/parse here
      // rebuilds every object with a normal prototype before it ever leaves
      // the client.
      getJSON: () => (editor ? (JSON.parse(JSON.stringify(editor.getJSON())) as JSONContent) : EMPTY_DOC),
      isEmpty: () => editor?.isEmpty ?? true,
      wordCount: () => editor?.storage.characterCount?.words() ?? 0,
      setContent: (content) => editor?.commands.setContent(content),
    }),
    [editor],
  );

  if (!editor) return null;

  return (
    <div className="flex flex-col rounded-xl border border-input bg-background">
      <EditorToolbar editor={editor} />
      <ImageBubbleMenu editor={editor} />
      <TableBubbleMenu editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex justify-end border-t border-input px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
        {editor.storage.characterCount?.words() ?? 0} mots · {editor.storage.characterCount?.characters() ?? 0} caractères
      </div>
    </div>
  );
});

export default ArticleEditor;
