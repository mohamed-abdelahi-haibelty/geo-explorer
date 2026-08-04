import { Laptop2 } from "lucide-react";
import { revokeSessionForm } from "@/server/actions/account";
import { Button } from "@/components/ui/button";

type SessionRow = {
  id: string;
  token: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
};

export function SessionsList({
  sessions,
  currentSessionId,
}: {
  sessions: SessionRow[];
  currentSessionId: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex items-center gap-3 rounded-lg border border-border p-3"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Laptop2 aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="flex items-center gap-2">
              <p className="truncate font-medium text-foreground">
                {session.userAgent || "Appareil inconnu"}
              </p>
              {session.id === currentSessionId && (
                <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide text-accent-foreground uppercase">
                  Actuelle
                </span>
              )}
            </div>
            <p className="truncate text-muted-foreground">
              {session.ipAddress || "IP inconnue"} · {session.createdAt.toLocaleString("fr-FR")}
            </p>
          </div>
          {session.id !== currentSessionId && (
            <form action={revokeSessionForm} className="shrink-0">
              <input type="hidden" name="token" value={session.token} />
              <Button type="submit" variant="outline" size="sm">
                Révoquer
              </Button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
