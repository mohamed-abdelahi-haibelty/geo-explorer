"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { login } from "@/server/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, null);
  // Controlled, unlike the password field: React resets uncontrolled fields
  // once a form action settles, even when it returns a failure state — so
  // an uncontrolled email field would empty itself on every wrong password.
  const [email, setEmail] = useState("");

  const hasError = state?.ok === false;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={next ?? ""} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "login-error" : undefined}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Mot de passe</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "login-error" : undefined}
        />
      </div>

      {hasError && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-1.5 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>
    </form>
  );
}
