"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

const DEBOUNCE_MS = 300;

// Filters as the visitor types instead of waiting for a form submit —
// debounced so every keystroke doesn't fire a navigation, and a soft
// `router.replace` (not `push`) so backspacing through a search doesn't
// pile up history entries. `scroll: false` keeps the results grid from
// jumping back to the top on every update. Tag stays attached so typing a
// query while a tag filter is active keeps composing both in the URL.
export function LiveSearchInput({
  basePath,
  tag,
  initialValue,
  placeholder,
  label,
}: {
  basePath: string;
  tag?: string;
  initialValue?: string;
  placeholder: string;
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keeps the field in sync when the URL changes from elsewhere (e.g. a tag
  // pill click) rather than from this input itself — React's own "adjusting
  // state during render" pattern (react.dev/learn/you-might-not-need-an-effect),
  // not a useEffect, so a prop change never costs a second cascading render.
  const [prevInitialValue, setPrevInitialValue] = useState(initialValue);
  if (initialValue !== prevInitialValue) {
    setPrevInitialValue(initialValue);
    setValue(initialValue ?? "");
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(next: string) {
    setValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      if (tag) params.set("tag", tag);
      const trimmed = next.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
      });
    }, DEBOUNCE_MS);
  }

  return (
    <div className="relative flex-1">
      <Search aria-hidden="true" className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
