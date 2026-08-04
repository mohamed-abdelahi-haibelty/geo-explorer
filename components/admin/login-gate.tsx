import Image from "next/image";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { LoginForm } from "@/components/admin/login-form";
import { LoginReveal } from "@/components/admin/login-reveal";
import logo from "@/public/assets/logo-mark.png";

export async function LoginGate({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    redirect("/admin");
  }

  const { next } = await searchParams;

  return (
    <LoginReveal className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src={logo} alt="" className="h-9 w-auto shrink-0" priority />
          <span className="font-heading text-base font-medium text-foreground">
            GeoExplorer Services
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="login-reveal-signal size-1.5 shrink-0 rounded-full bg-secondary"
            aria-hidden="true"
          />
          <span className="font-mono text-[0.6875rem] tracking-widest text-muted-foreground uppercase">
            Back-office
          </span>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
        <svg
          aria-hidden="true"
          viewBox="0 0 560 560"
          className="pointer-events-none absolute top-1/2 -right-20 hidden -translate-y-1/2 text-secondary xl:block"
          width="420"
          height="420"
        >
          <circle cx="280" cy="280" r="279" fill="none" stroke="currentColor" strokeOpacity="0.07" />
          <circle cx="280" cy="280" r="196" fill="none" stroke="currentColor" strokeOpacity="0.07" />
          <circle cx="280" cy="280" r="113" fill="none" stroke="currentColor" strokeOpacity="0.07" />
          <line x1="280" y1="6" x2="280" y2="554" stroke="currentColor" strokeOpacity="0.07" />
          <line x1="6" y1="280" x2="554" y2="280" stroke="currentColor" strokeOpacity="0.07" />
          <circle cx="280" cy="280" r="3.5" fill="var(--primary)" fillOpacity="0.35" />
        </svg>

        <div className="relative flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="login-reveal-item font-heading text-2xl">
              Connexion
            </h1>
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="login-reveal-band h-0.75 w-10 origin-left rounded-full bg-primary" />
              <span className="login-reveal-band h-0.75 w-6 origin-left rounded-full bg-secondary" />
              <span className="login-reveal-band h-0.75 w-3 origin-left rounded-full bg-muted-foreground/40" />
            </div>
            <p className="login-reveal-item text-sm text-muted-foreground">
              Accès réservé à l&apos;administration de GeoExplorer Services.
            </p>
          </div>
          <div className="login-reveal-item">
            <LoginForm next={next} />
          </div>
        </div>
      </main>
    </LoginReveal>
  );
}
