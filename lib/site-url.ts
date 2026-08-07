import { getSiteSetting } from "@/server/queries/settings";

// Absolute site origin for metadataBase/sitemap/RSS — SiteSetting.siteUrl is
// the admin-editable source of truth (already seeded); BETTER_AUTH_URL is
// the only other absolute app URL already validated at boot, used as a
// fallback so metadata generation never breaks on an empty settings row.
export async function getSiteUrl(): Promise<string> {
  const settings = await getSiteSetting();
  return settings?.siteUrl || process.env.BETTER_AUTH_URL || "http://localhost:3000";
}
