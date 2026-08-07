"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns2,
  Rows2,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}

// Shown whenever the cursor/selection is inside a table — every prosemirror-
// tables command below is a no-op outside one, so `shouldShow` gates the
// whole menu on `editor.isActive('table')` rather than each button on its
// own. `can()` still gates each button individually (e.g. "delete column" on
// a single-column table), same pattern as the undo/redo buttons in
// editor-toolbar.tsx.
export function TableBubbleMenu({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor || ctx.editor.isDestroyed || !ctx.editor.isActive("table")) {
        return {
          active: false,
          canAddColumnBefore: false,
          canAddColumnAfter: false,
          canDeleteColumn: false,
          canAddRowBefore: false,
          canAddRowAfter: false,
          canDeleteRow: false,
          canToggleHeaderRow: false,
          canToggleHeaderColumn: false,
          canMergeCells: false,
          canSplitCell: false,
          canDeleteTable: false,
        };
      }
      return {
        active: true,
        canAddColumnBefore: ctx.editor.can().addColumnBefore(),
        canAddColumnAfter: ctx.editor.can().addColumnAfter(),
        canDeleteColumn: ctx.editor.can().deleteColumn(),
        canAddRowBefore: ctx.editor.can().addRowBefore(),
        canAddRowAfter: ctx.editor.can().addRowAfter(),
        canDeleteRow: ctx.editor.can().deleteRow(),
        canToggleHeaderRow: ctx.editor.can().toggleHeaderRow(),
        canToggleHeaderColumn: ctx.editor.can().toggleHeaderColumn(),
        canMergeCells: ctx.editor.can().mergeCells(),
        canSplitCell: ctx.editor.can().splitCell(),
        canDeleteTable: ctx.editor.can().deleteTable(),
      };
    },
  });

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="tableBubbleMenu"
      shouldShow={({ editor: bubbleEditor }) => bubbleEditor.isActive("table")}
      options={{ placement: "top", offset: 10 }}
    >
      <div className="flex items-center gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-md">
        <div role="group" aria-label="Colonnes" className="flex items-center gap-0.5">
          <ToolbarButton label="Insérer une colonne avant" disabled={!state.canAddColumnBefore} onClick={() => editor.chain().focus().addColumnBefore().run()}>
            <ArrowLeftToLine aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Insérer une colonne après" disabled={!state.canAddColumnAfter} onClick={() => editor.chain().focus().addColumnAfter().run()}>
            <ArrowRightToLine aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Supprimer la colonne" disabled={!state.canDeleteColumn} onClick={() => editor.chain().focus().deleteColumn().run()}>
            <Trash2 aria-hidden="true" className="size-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div role="group" aria-label="Lignes" className="flex items-center gap-0.5">
          <ToolbarButton label="Insérer une ligne au-dessus" disabled={!state.canAddRowBefore} onClick={() => editor.chain().focus().addRowBefore().run()}>
            <ArrowUpToLine aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Insérer une ligne en dessous" disabled={!state.canAddRowAfter} onClick={() => editor.chain().focus().addRowAfter().run()}>
            <ArrowDownToLine aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Supprimer la ligne" disabled={!state.canDeleteRow} onClick={() => editor.chain().focus().deleteRow().run()}>
            <Trash2 aria-hidden="true" className="size-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div role="group" aria-label="En-têtes" className="flex items-center gap-0.5">
          <ToolbarButton label="Ligne d'en-tête" disabled={!state.canToggleHeaderRow} onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
            <Rows2 aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Colonne d'en-tête" disabled={!state.canToggleHeaderColumn} onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
            <Columns2 aria-hidden="true" className="size-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <div role="group" aria-label="Cellules" className="flex items-center gap-0.5">
          <ToolbarButton label="Fusionner les cellules" disabled={!state.canMergeCells} onClick={() => editor.chain().focus().mergeCells().run()}>
            <TableCellsMerge aria-hidden="true" className="size-4" />
          </ToolbarButton>
          <ToolbarButton label="Diviser la cellule" disabled={!state.canSplitCell} onClick={() => editor.chain().focus().splitCell().run()}>
            <TableCellsSplit aria-hidden="true" className="size-4" />
          </ToolbarButton>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5" />

        <ToolbarButton label="Supprimer le tableau" disabled={!state.canDeleteTable} onClick={() => editor.chain().focus().deleteTable().run()}>
          <Trash2 aria-hidden="true" className="size-4" />
        </ToolbarButton>
      </div>
    </BubbleMenu>
  );
}
