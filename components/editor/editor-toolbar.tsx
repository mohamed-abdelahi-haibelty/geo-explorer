"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  MonitorPlay,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { MediaPicker } from "@/components/admin/media-picker";
import { cn } from "@/lib/utils";
import type { MediaAsset } from "@/prisma/generated/client";

function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

function LinkButton({ editor, active }: { editor: Editor; active: boolean }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function applyLink() {
    const trimmed = url.trim();
    if (trimmed) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setOpen(false);
    setUrl("");
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setUrl(editor.getAttributes("link").href ?? "");
      }}
    >
      <PopoverTrigger
        render={<ToolbarButton label="Lien" active={active} onClick={() => setOpen(true)} />}
      >
        <Link2 aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="flex-row w-72 items-center gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://…"
          aria-label="URL du lien"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applyLink();
            }
          }}
        />
        <Button type="button" size="sm" onClick={applyLink}>
          {url.trim() ? "Insérer" : "Retirer"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function YoutubeButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function insert() {
    const trimmed = url.trim();
    if (trimmed) editor.chain().focus().setYoutubeVideo({ src: trimmed }).run();
    setOpen(false);
    setUrl("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<ToolbarButton label="Vidéo YouTube" onClick={() => setOpen(true)} />}>
        <MonitorPlay aria-hidden="true" className="size-4" />
      </PopoverTrigger>
      <PopoverContent className="flex-row w-72 items-center gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          aria-label="URL YouTube"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              insert();
            }
          }}
        />
        <Button type="button" size="sm" onClick={insert} disabled={!url.trim()}>
          Insérer
        </Button>
      </PopoverContent>
    </Popover>
  );
}

export function EditorToolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    // React 19 Strict Mode double-invokes effects in dev, briefly destroying
    // and recreating the Tiptap instance — the selector can fire mid-teardown
    // with a null/destroyed ctx.editor, so it needs its own guard rather than
    // trusting the (non-null) `editor` prop.
    selector: (ctx) => {
      if (!ctx.editor || ctx.editor.isDestroyed) {
        return {
          bold: false,
          italic: false,
          underline: false,
          strike: false,
          superscript: false,
          subscript: false,
          code: false,
          link: false,
          blockquote: false,
          codeBlock: false,
          bulletList: false,
          orderedList: false,
          h2: false,
          h3: false,
          h4: false,
          canUndo: false,
          canRedo: false,
        };
      }
      return {
        bold: ctx.editor.isActive("bold"),
        italic: ctx.editor.isActive("italic"),
        underline: ctx.editor.isActive("underline"),
        strike: ctx.editor.isActive("strike"),
        superscript: ctx.editor.isActive("superscript"),
        subscript: ctx.editor.isActive("subscript"),
        code: ctx.editor.isActive("code"),
        link: ctx.editor.isActive("link"),
        blockquote: ctx.editor.isActive("blockquote"),
        codeBlock: ctx.editor.isActive("codeBlock"),
        bulletList: ctx.editor.isActive("bulletList"),
        orderedList: ctx.editor.isActive("orderedList"),
        h2: ctx.editor.isActive("heading", { level: 2 }),
        h3: ctx.editor.isActive("heading", { level: 3 }),
        h4: ctx.editor.isActive("heading", { level: 4 }),
        canUndo: ctx.editor.can().undo(),
        canRedo: ctx.editor.can().redo(),
      };
    },
  });

  function insertImage(assets: MediaAsset[]) {
    const asset = assets[0];
    if (!asset) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: "image",
        attrs: {
          src: asset.url,
          publicId: asset.publicId,
          alt: asset.alt ?? "",
          width: asset.width ?? null,
          height: asset.height ?? null,
        },
      })
      .run();
  }

  return (
    <div role="toolbar" aria-label="Mise en forme" className="flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/40 p-1.5">
      <ToolbarButton label="Annuler" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Rétablir" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 aria-hidden="true" className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton label="Titre 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Titre 3" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Titre 4" active={state.h4} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        <Heading4 aria-hidden="true" className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton label="Gras" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Italique" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Souligné" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Barré" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Exposant" active={state.superscript} onClick={() => editor.chain().focus().toggleSuperscript().run()}>
        <SuperscriptIcon aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Indice" active={state.subscript} onClick={() => editor.chain().focus().toggleSubscript().run()}>
        <SubscriptIcon aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Code" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <LinkButton editor={editor} active={state.link} />

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton label="Liste à puces" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Liste numérotée" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Citation" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Bloc de code" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <ToolbarButton label="Ligne horizontale" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus aria-hidden="true" className="size-4" />
      </ToolbarButton>

      <Separator orientation="vertical" className="mx-1 h-5" />

      <ToolbarButton
        label="Insérer un tableau"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
      >
        <TableIcon aria-hidden="true" className="size-4" />
      </ToolbarButton>
      <MediaPicker
        accept={["IMAGE"]}
        trigger={
          <ToolbarButton label="Insérer une image" onClick={() => {}}>
            <ImagePlus aria-hidden="true" className="size-4" />
          </ToolbarButton>
        }
        onSelect={insertImage}
      />
      <YoutubeButton editor={editor} />
    </div>
  );
}
