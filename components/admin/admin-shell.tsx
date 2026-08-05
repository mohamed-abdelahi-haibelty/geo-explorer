import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { ExternalLink } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

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
      className="flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50 group-data-[collapsible=icon]:justify-center"
    >
      <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-sidebar-border group-data-[collapsible=icon]:size-8">
        <Image src="/assets/logo-mark.png" alt="" fill sizes="36px" className="object-contain p-1" unoptimized />
      </span>
      <span className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
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

export async function AdminShell({
  user,
  pathname,
  children,
}: {
  user: { name: string; email: string };
  pathname: string;
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const initials = getInitials(user.name);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen} className="h-dvh overflow-hidden bg-background">
        <Sidebar collapsible="icon" className="border-sidebar-border">
          <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:flex-col">
              <BrandMark />
              <SidebarTrigger className="ml-auto shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground group-data-[collapsible=icon]:ml-0" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <AdminNav pathname={pathname} />
          </SidebarContent>

          <SidebarFooter className="gap-3 p-3 group-data-[collapsible=icon]:p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/" target="_blank" rel="noopener noreferrer" />}
                  tooltip="Voir le site"
                  className="text-sidebar-foreground/70"
                >
                  <ExternalLink aria-hidden="true" />
                  <span>Voir le site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton render={<Link href="/admin/compte" />} size="lg" tooltip={user.name}>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-mono text-xs font-semibold text-sidebar-primary-foreground">
                    {initials}
                  </span>
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-sidebar-foreground">
                      {user.name}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">{user.email}</span>
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SignOutButton className="group-data-[collapsible=icon]:hidden" />
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset className="overflow-hidden">
          <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
            <SidebarTrigger />
            <BrandMark />
          </header>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">{children}</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
