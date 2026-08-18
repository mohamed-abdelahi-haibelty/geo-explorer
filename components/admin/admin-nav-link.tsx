"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { isNavActive } from "@/lib/nav-active";

// The active item has to be derived on the client: AdminShell/AdminNav are
// server components rendered by the (admin) layout, and a layout is not
// re-rendered on client-side navigations — so the `x-pathname` header the
// proxy forwards is frozen at whichever /admin URL was first requested and
// left the same item highlighted forever. usePathname() re-renders on every
// navigation instead. (Safe under Cache Components here: the whole admin
// tree already sits inside the layout's <Suspense> boundary.)
export function AdminNavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, href, href === "/admin");

  return (
    <SidebarMenuButton
      render={<Link href={href} aria-current={active ? "page" : undefined} />}
      isActive={active}
      tooltip={label}
    >
      {children}
    </SidebarMenuButton>
  );
}
