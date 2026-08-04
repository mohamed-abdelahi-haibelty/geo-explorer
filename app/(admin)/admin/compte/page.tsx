import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { KeyRound, MonitorSmartphone } from "lucide-react";
import { auth } from "@/server/auth";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { SessionsList } from "@/components/admin/sessions-list";

export default async function AccountPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const sessions = await auth.api.listSessions({ headers: requestHeaders });

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-heading text-2xl text-foreground">Compte</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos identifiants et vos sessions actives.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <KeyRound aria-hidden="true" className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-base text-foreground">Mot de passe</h2>
        </div>
        <ChangePasswordForm />
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <div className="flex items-center gap-2.5">
          <MonitorSmartphone aria-hidden="true" className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-base text-foreground">Sessions actives</h2>
        </div>
        <SessionsList sessions={sessions ?? []} currentSessionId={session.session.id} />
      </section>
    </div>
  );
}
