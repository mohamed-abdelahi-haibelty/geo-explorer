"use client";

import dynamic from "next/dynamic";

// The only import site for Tiptap outside components/editor itself — keeps it
// out of the (admin) route's initial JS and entirely out of (site) bundles.
const ArticleEditor = dynamic(() => import("@/components/editor/article-editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-input bg-muted/30 text-sm text-muted-foreground">
      Chargement de l&apos;éditeur…
    </div>
  ),
});

export default ArticleEditor;
