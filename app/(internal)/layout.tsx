import "../globals.css";
import { FONT_VARIABLES } from "@/lib/fonts";

// Root layout for /login and /apercu/** — internal, French-only, LTR
// utility screens (auth gate, draft preview token exchange). A route group,
// so it adds no path segment; URLs are unaffected by the move here.
export default function InternalRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr" className={`${FONT_VARIABLES} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
