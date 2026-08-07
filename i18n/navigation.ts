import { createNavigation } from "next-intl/navigation";
import { routing } from "@/i18n/routing";

// Locale-aware Link/redirect/usePathname/useRouter/getPathname — for the
// public [locale]/(site) tree only. Admin/login/apercu keep plain
// next/link and next/navigation (no locale prefix on those routes).
export const { Link, redirect, permanentRedirect, useRouter, usePathname, getPathname } =
  createNavigation(routing);
