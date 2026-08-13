"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "NEW", label: "Nouveau" },
  { value: "READ", label: "Lu" },
  { value: "ARCHIVED", label: "Archivé" },
  { value: "SPAM", label: "Indésirable" },
];

export function MessageFilters({ status }: { status?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function pushStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("status");
    else params.set("status", value);
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <Select items={STATUS_OPTIONS} value={status ?? "all"} onValueChange={(value) => pushStatus(String(value))}>
      <SelectTrigger aria-label="Filtrer par statut" className="w-full sm:w-48">
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
  );
}
