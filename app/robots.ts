import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

// Disallow admin, sign-in, API routes and the draft-preview surface —
// none of it is content a crawler should ever index.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = (await getSiteUrl()).replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api", "/apercu"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
