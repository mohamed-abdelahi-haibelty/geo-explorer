import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description = "Cette section n'est pas encore disponible.",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 py-8">
      <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-5" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-xl text-foreground">{title}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
