"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "PUBLISHED", label: "Publié" },
  { value: "ARCHIVED", label: "Archivé" },
];

const SORT_OPTIONS = [
  { value: "updated_desc", label: "Mis à jour (récent)" },
  { value: "updated_asc", label: "Mis à jour (ancien)" },
];

export function NewsFilters({ search, status, sort }: { search?: string; status?: string; sort: string }) {
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

  useEffect(() => {
    if (query === (search ?? "")) return;
    const timeout = setTimeout(() => pushParams({ q: query || undefined }), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Rechercher un titre"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-8"
          aria-label="Rechercher une actualité"
        />
      </div>

      <Select items={STATUS_OPTIONS} value={status ?? "all"} onValueChange={(value) => pushParams({ status: value === "all" ? undefined : String(value) })}>
        <SelectTrigger aria-label="Filtrer par statut" className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select items={SORT_OPTIONS} value={sort} onValueChange={(value) => pushParams({ sort: String(value) })}>
        <SelectTrigger aria-label="Trier" className="w-full sm:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
