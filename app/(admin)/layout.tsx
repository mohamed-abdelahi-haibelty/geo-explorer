import type { Metadata } from "next";
import "../globals.css";
import { FONT_VARIABLES, SITE_TITLE } from "@/lib/fonts";

// Root layout for the whole (admin) branch — French-only, LTR always, no
// locale segment: the admin is one person, and translating the CMS
// interface has no value. The existing app/(admin)/admin/layout.tsx
// (AdminGate + Toaster + Suspense) nests inside this and is unchanged in
// content.
export const metadata: Metadata = {
  title: `Back-office · ${SITE_TITLE}`,
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
