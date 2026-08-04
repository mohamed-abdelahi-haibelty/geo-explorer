"use client";

import { useActionState, useState } from "react";
import { Check, X } from "lucide-react";
import { changePassword } from "@/server/actions/account";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PASSWORD_MIN_LENGTH, passwordRules } from "@/lib/validation/password";
import { cn } from "@/lib/utils";

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  // Controlled fields don't get React's reset-on-settle behavior that
  // uncontrolled inputs get after a form action — clear them ourselves once
  // the password change succeeds, adjusting state during render (React's
  // documented alternative to a setState-in-effect here).
  const [settledState, setSettledState] = useState(state);
  if (state !== settledState) {
    setSettledState(state);
    if (state?.ok) {
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <PasswordInput
          id="currentPassword"
          name="currentPassword"
          autoComplete="current-password"
          required
          aria-invalid={state && !state.ok && !!state.fields?.currentPassword ? true : undefined}
          aria-describedby={
            state && !state.ok && state.fields?.currentPassword ? "currentPassword-error" : undefined
          }
        />
        {state && !state.ok && state.fields?.currentPassword && (
          <p id="currentPassword-error" role="alert" className="text-sm text-destructive">
            {state.fields.currentPassword}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
        <PasswordInput
          id="newPassword"
          name="newPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          aria-describedby={
            state && !state.ok && state.fields?.newPassword
              ? "newPassword-rules newPassword-error"
              : "newPassword-rules"
          }
        />
        <ul id="newPassword-rules" aria-live="polite" className="flex flex-col gap-1 pt-1">
          {passwordRules.map((rule) => {
            const valid = rule.test(newPassword);
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  valid ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {valid ? (
                  <Check className="size-3 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <X className="size-3 shrink-0" aria-hidden="true" />
                )}
                <span className="sr-only">{valid ? "Respecté : " : "Non respecté : "}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
        {state && !state.ok && state.fields?.newPassword && (
          <p id="newPassword-error" role="alert" className="text-sm text-destructive">
            {state.fields.newPassword}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={PASSWORD_MIN_LENGTH}
          required
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          aria-invalid={mismatch || (state && !state.ok && !!state.fields?.confirmPassword) || undefined}
          aria-describedby={
            mismatch || (state && !state.ok && state.fields?.confirmPassword)
              ? "confirmPassword-error"
              : undefined
          }
        />
        {mismatch && (
          <p id="confirmPassword-error" role="alert" className="text-sm text-destructive">
            Les mots de passe ne correspondent pas.
          </p>
        )}
        {!mismatch && state && !state.ok && state.fields?.confirmPassword && (
          <p id="confirmPassword-error" role="alert" className="text-sm text-destructive">
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
        <p role="status" className="text-sm text-foreground">
          Mot de passe mis à jour.
        </p>
      )}

      <Button
        type="submit"
        disabled={
          pending ||
          confirmPassword !== newPassword ||
          !passwordRules.every((rule) => rule.test(newPassword))
        }
      >
        {pending ? "Enregistrement…" : "Mettre à jour"}
      </Button>
    </form>
  );
}
