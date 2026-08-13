"use client";

import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SERVICE_ICON_NAMES } from "@/lib/service-icons";

export function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const isKnownIcon = (SERVICE_ICON_NAMES as readonly string[]).includes(value);

  return (
    <Select value={value} onValueChange={(next) => onChange(String(next))}>
      <SelectTrigger className="w-full" aria-label="Icône">
        <div className="flex items-center gap-2">
          {isKnownIcon && <DynamicIcon name={value as IconName} className="size-4" />}
          <SelectValue placeholder="Choisir une icône" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {SERVICE_ICON_NAMES.map((name) => (
          <SelectItem key={name} value={name}>
            <span className="flex items-center gap-2">
              <DynamicIcon name={name} className="size-4" />
              {name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
