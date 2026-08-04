import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginGate } from "@/components/admin/login-gate";

export const metadata: Metadata = {
  title: "Connexion — Back-office · GeoExplorer Services",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <Suspense>
      <LoginGate searchParams={searchParams} />
    </Suspense>
  );
}
