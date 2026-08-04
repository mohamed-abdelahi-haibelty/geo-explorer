import { Suspense } from "react";
import { AdminGate } from "@/components/admin/admin-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminGate>{children}</AdminGate>
    </Suspense>
  );
}
