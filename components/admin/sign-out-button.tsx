import { LogOut } from "lucide-react";
import { signOut } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm" className={cn("w-full", className)}>
        <LogOut aria-hidden="true" />
        Se déconnecter
      </Button>
    </form>
  );
}
