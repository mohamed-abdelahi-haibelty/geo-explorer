"use client";

import { useActionState } from "react";
import { changePassword } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        {state && !state.ok && state.fields?.currentPassword && (
          <p role="alert" className="text-sm text-destructive">
            {state.fields.currentPassword}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        {state && !state.ok && state.fields?.newPassword && (
          <p role="alert" className="text-sm text-destructive">
            {state.fields.newPassword}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={12}
          required
        />
        {state && !state.ok && state.fields?.confirmPassword && (
          <p role="alert" className="text-sm text-destructive">
            {state.fields.confirmPassword}
          </p>
        )}
      </div>

      {state && !state.ok && !state.fields && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}
      {state?.ok && (
        <p role="status" className="text-sm text-primary">
          Mot de passe mis à jour.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
