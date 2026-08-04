import Image from "next/image";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { MobileNav } from "@/components/admin/mobile-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return initials || "?";
}

// --sidebar-foreground and --foreground share the same value (globals.css),
// so this reads correctly whether the surrounding chrome is the cobalt-tinted
// sidebar panel or the plain white mobile header.
function BrandMark() {
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-sidebar-border">
        <Image src="/assets/logo-mark.png" alt="" fill sizes="36px" className="object-contain p-1" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-sm font-semibold text-sidebar-foreground">
          GeoExplorer Services
        </span>
        <span className="font-mono text-[10px] font-medium tracking-[0.08em] text-sidebar-foreground/50 uppercase">
          Back-office
        </span>
      </span>
    </Link>
  );
}

function SidebarPanel({
  user,
  pathname,
}: {
  user: { name: string; email: string };
  pathname: string;
}) {
  const initials = getInitials(user.name);

  return (
    <>
      <div className="border-b border-sidebar-border p-4">
        <BrandMark />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AdminNav pathname={pathname} />
      </div>

      <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm text-sidebar-foreground/70 outline-none transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ExternalLink aria-hidden="true" className="size-4" />
          Voir le site
        </Link>

        <div className="flex flex-col gap-2 border-t border-sidebar-border pt-3">
          <Link
            href="/admin/compte"
            className="flex min-w-0 items-center gap-2.5 rounded-lg p-1.5 outline-none transition-colors hover:bg-sidebar-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-mono text-xs font-semibold text-sidebar-primary-foreground">
              {initials}
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
            </span>
          </Link>
          <SignOutButton className="w-full" />
        </div>
      </div>
    </>
  );
}

export function AdminShell({
  user,
  pathname,
  children,
}: {
  user: { name: string; email: string };
  pathname: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <aside
        aria-label="Barre latérale d'administration"
        className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex"
      >
        <SidebarPanel user={user} pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
          <MobileNav>
            <SidebarPanel user={user} pathname={pathname} />
          </MobileNav>
          <BrandMark />
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
