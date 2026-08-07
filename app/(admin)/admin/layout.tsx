import { Suspense } from "react";
import { Toaster } from "sonner";
import { AdminGate } from "@/components/admin/admin-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminGate>{children}</AdminGate>
      <Toaster richColors closeButton position="top-right" />
    </Suspense>
  );
}
