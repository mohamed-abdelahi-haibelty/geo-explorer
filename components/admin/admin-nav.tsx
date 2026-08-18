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
import { AdminNavLink } from "@/components/admin/admin-nav-link";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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

export async function AdminNav() {
  const { unreadMessages } = await getDashboardCounts();

  return (
    <nav aria-label="Navigation principale">
      {NAV_SECTIONS.map((section, index) => (
        <SidebarGroup key={section.label ?? `top-${index}`}>
          {section.label && (
            <SidebarGroupLabel className="font-mono text-[10px] tracking-[0.08em] text-sidebar-foreground/50 uppercase">
              {section.label}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = item.href === "/admin/messages" ? unreadMessages : 0;

                return (
                  <SidebarMenuItem key={item.href}>
                    <AdminNavLink href={item.href} label={item.label}>
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </AdminNavLink>
                    {badge > 0 && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </nav>
  );
}
