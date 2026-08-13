"use client";

import { useEffect, useRef } from "react";
import { incrementArticleViewCount } from "@/server/actions/public";

// Renders nothing — fires once on mount, un-awaited, and never again for
// this mount (the ref guard is for React Strict Mode's double-invoke in
// dev, not a correctness requirement in production). See
// server/actions/public.ts for why this deliberately never revalidates.
export function ViewCounter({ articleId }: { articleId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void incrementArticleViewCount(articleId);
  }, [articleId]);

  return null;
}
