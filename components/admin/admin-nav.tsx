import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Handshake,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Newspaper,
  PanelsTopLeft,
  Layers,
  Settings,
  Users,
} from "lucide-react";
import { getDashboardCounts } from "@/server/queries/dashboard";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavSection = { label?: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    items: [{ label: "Tableau de bord", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Contenu",
    items: [
      { label: "Articles", href: "/admin/articles", icon: FileText },
      { label: "Actualités", href: "/admin/actualites", icon: Newspaper },
      { label: "Services", href: "/admin/services", icon: Layers },
      { label: "Pages", href: "/admin/pages", icon: PanelsTopLeft },
      { label: "Partenaires", href: "/admin/partenaires", icon: Handshake },
      { label: "Médias", href: "/admin/medias", icon: ImageIcon },
      { label: "Auteurs", href: "/admin/auteurs", icon: Users },
    ],
  },
  {
    label: "Système",
    items: [
      { label: "Messages", href: "/admin/messages", icon: Mail },
      { label: "Paramètres", href: "/admin/parametres", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export async function AdminNav({ pathname }: { pathname: string }) {
  const { unreadMessages } = await getDashboardCounts();

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-5">
      {NAV_SECTIONS.map((section, index) => (
        <div key={section.label ?? `top-${index}`} className="flex flex-col gap-1">
          {section.label && (
            <h2 className="px-2.5 pb-1 font-mono text-[10px] font-medium tracking-[0.08em] text-sidebar-foreground/50 uppercase">
              {section.label}
            </h2>
          )}
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const badge = item.href === "/admin/messages" ? unreadMessages : 0;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-4 shrink-0",
                        active
                          ? "text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/45 group-hover:text-sidebar-foreground/80",
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {badge > 0 && (
                      <span className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 font-mono text-[10px] font-semibold tabular-nums text-primary-foreground">
                        {badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
