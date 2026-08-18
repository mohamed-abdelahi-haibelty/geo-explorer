import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { AdminShell } from "@/components/admin/admin-shell";

const PASSWORD_CHANGE_PATH = "/admin/compte";

// Runtime data access (headers/session) has to live in a component nested
// under a <Suspense> boundary under Cache Components — see (admin)/admin/layout.tsx.
export async function AdminGate({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  // Set by proxy.ts on every /admin/* request — avoids a DB round trip here
  // just to know whether we're already on the password-change screen. It is
  // deliberately NOT used for the sidebar's active item: this layout does not
  // re-render on client-side navigations, so the value goes stale the moment
  // the admin navigates (AdminNavLink reads usePathname() instead).
  const pathname = requestHeaders.get("x-pathname") ?? "/admin";
  if (session.user.mustChangePassword && pathname !== PASSWORD_CHANGE_PATH) {
    redirect(PASSWORD_CHANGE_PATH);
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
