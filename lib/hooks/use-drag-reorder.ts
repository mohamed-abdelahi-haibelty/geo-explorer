"use client";

import { useRef, useState, type DragEvent } from "react";

// Left unset, the browser's default drag "ghost" is a live paint of the
// dragged element *in place* — for a <tr> inside the admin's fixed
// sidebar/header shell, that paint sometimes bleeds neighbouring chrome
// into the ghost (a documented Chromium/WebKit quirk: a <tr> has no
// independent stacking context once torn from its <table>, so the
// snapshot falls back to compositing the region around it). Cloning the
// row into an isolated, off-screen node and handing that to
// setDragImage sidesteps it — the ghost is now a paint of a detached
// element with nothing behind it to bleed in. <tr> clones are re-wrapped
// in a bare <table><tbody> so they keep their cell layout instead of
// collapsing to unstyled inline content once outside a table.
function buildDragImage(source: HTMLElement): HTMLElement {
  const rect = source.getBoundingClientRect();
  const clone = source.cloneNode(true) as HTMLElement;
  const host = source.tagName === "TR" ? document.createElement("table") : document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "-1000px";
  host.style.left = "-1000px";
  host.style.width = `${rect.width}px`;
  host.style.pointerEvents = "none";
  host.style.margin = "0";
  if (source.tagName === "TR") {
    const tbody = document.createElement("tbody");
    tbody.appendChild(clone);
    host.appendChild(tbody);
  } else {
    host.appendChild(clone);
  }
  document.body.appendChild(host);
  return host;
}

// Extracted from NewsGalleryEditor's inline drag state once the call sites
// tripled (services list, service blocks, partners), past the point where
// re-deriving the same handful of functions per component is worth it.
// Native HTML5 drag-and-drop, no library; `move` covers
// keyboard operability (up/down chevrons), `dragHandlers`/`isDropTarget`
// cover the pointer path.
export function useDragReorder<T>(items: T[], onChange: (items: T[]) => void) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragImageHost = useRef<HTMLElement | null>(null);

  function cleanupDragImage() {
    dragImageHost.current?.remove();
    dragImageHost.current = null;
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  }

  function dragHandlers(index: number) {
    return {
      draggable: true,
      onDragStart: (event: DragEvent<HTMLElement>) => {
        setDragIndex(index);
        const rect = event.currentTarget.getBoundingClientRect();
        const host = buildDragImage(event.currentTarget);
        dragImageHost.current = host;
        event.dataTransfer?.setDragImage(host, event.clientX - rect.left, event.clientY - rect.top);
      },
      onDragOver: (event: DragEvent) => {
        event.preventDefault();
        setOverIndex(index);
      },
      onDragEnd: () => {
        setDragIndex(null);
        setOverIndex(null);
        cleanupDragImage();
      },
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        if (dragIndex !== null) reorder(dragIndex, index);
        setDragIndex(null);
        setOverIndex(null);
        cleanupDragImage();
      },
    };
  }

  function isDropTarget(index: number) {
    return overIndex === index && dragIndex !== null && dragIndex !== index;
  }

  return { move, reorder, dragHandlers, isDropTarget };
}
