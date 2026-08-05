"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "IMAGE", label: "Images" },
  { value: "VIDEO", label: "Vidéos" },
  { value: "RAW", label: "PDF" },
];

export function MediaFilters({ type, search }: { type?: string; search?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(search ?? "");

  function pushParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounce the search box; the type select navigates immediately since
  // it's a discrete choice, not free text.
  useEffect(() => {
    if (query === (search ?? "")) return;
    const timeout = setTimeout(() => pushParams({ q: query || undefined }), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher par nom ou texte alternatif"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-8"
          aria-label="Rechercher un média"
        />
      </div>
      <Select
        items={TYPE_OPTIONS}
        value={type ?? "all"}
        onValueChange={(value) => pushParams({ type: value === "all" ? undefined : String(value) })}
      >
        <SelectTrigger aria-label="Filtrer par type" className="w-full sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
