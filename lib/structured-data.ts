import type { LocaleCode } from "@/lib/validation/locale";

// Breadcrumb labels only — small enough, and used by exactly four detail
// pages, that a shared dict here beats importing next-intl's server APIs
// into pages that deliberately avoid them (see (site)/layout.tsx's note on
// why the public site sticks to plain per-locale dictionaries).
export const BREADCRUMB_LABELS: Record<LocaleCode, { home: string; articles: string; actualites: string; services: string; auteurs: string }> = {
  fr: { home: "Accueil", articles: "Articles", actualites: "Actualités", services: "Services", auteurs: "Auteurs" },
  en: { home: "Home", articles: "Articles", actualites: "News", services: "Services", auteurs: "Authors" },
  ar: { home: "الرئيسية", articles: "المقالات", actualites: "الأخبار", services: "الخدمات", auteurs: "المؤلفون" },
};

// Plain JSON-LD object builders — pure functions over already-resolved
// data, no DB access here, so every call site stays in
// control of exactly what it fetches. `siteUrl` is always the trimmed
// (no trailing slash) value from `getSiteUrl()`.

// Shared shape every schema builder below expects; every public page already
// fetches `getSiteSetting()` for its own header/footer/contact rendering, so
// this just repackages that same row rather than issuing a second query.
type SiteSettingRow = {
  companyName: string;
  address: string | null;
  phones: string[];
  email: string | null;
  linkedin: string | null;
  facebook: string | null;
} | null;

export function orgInfoFromSettings(settings: SiteSettingRow, siteUrl: string): OrgInfo {
  return {
    companyName: settings?.companyName ?? "GeoExplorer Services",
    siteUrl,
    logoUrl: `${siteUrl}/assets/logo-mark.png`,
    address: settings?.address ?? null,
    phones: settings?.phones ?? [],
    email: settings?.email ?? null,
    linkedin: settings?.linkedin ?? null,
    facebook: settings?.facebook ?? null,
  };
}

type OrgInfo = {
  companyName: string;
  siteUrl: string;
  logoUrl?: string | null;
  address?: string | null;
  phones?: string[];
  email?: string | null;
  linkedin?: string | null;
  facebook?: string | null;
};

export function buildOrganizationSchema(org: OrgInfo) {
  const sameAs = [org.linkedin, org.facebook].filter((url): url is string => Boolean(url));
  return {
    "@type": "Organization",
    "@id": `${org.siteUrl}/#organization`,
    name: org.companyName,
    url: org.siteUrl,
    ...(org.logoUrl ? { logo: org.logoUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(org.phones && org.phones.length > 0
      ? { contactPoint: { "@type": "ContactPoint", telephone: org.phones[0], contactType: "customer service" } }
      : {}),
    ...(org.email ? { email: org.email } : {}),
  };
}

export function buildWebSiteSchema(org: OrgInfo) {
  return {
    "@type": "WebSite",
    "@id": `${org.siteUrl}/#website`,
    name: org.companyName,
    url: org.siteUrl,
    publisher: { "@id": `${org.siteUrl}/#organization` },
  };
}

export function buildArticleSchema({
  type = "Article",
  siteUrl,
  url,
  headline,
  description,
  imageUrl,
  datePublished,
  dateModified,
  authorNames,
}: {
  type?: "Article" | "NewsArticle";
  siteUrl: string;
  url: string;
  headline: string;
  description?: string | null;
  imageUrl?: string | null;
  datePublished?: Date | null;
  dateModified?: Date | null;
  authorNames: string[];
}) {
  return {
    "@type": type,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline,
    ...(description ? { description } : {}),
    ...(imageUrl ? { image: [imageUrl] } : {}),
    ...(datePublished ? { datePublished: datePublished.toISOString() } : {}),
    dateModified: (dateModified ?? datePublished ?? new Date()).toISOString(),
    // News items have no named byline (News.createdBy is internal
    // bookkeeping, never surfaced publicly) — falls back to the
    // organization itself, which NewsArticle's schema still accepts as an
    // `author` (Google's structured-data guidelines require the field to be
    // present, not necessarily a Person).
    author:
      authorNames.length > 0
        ? authorNames.map((name) => ({ "@type": "Person", name }))
        : { "@id": `${siteUrl}/#organization` },
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function buildServiceSchema({
  name,
  description,
  url,
  imageUrl,
  organization,
}: {
  name: string;
  description?: string | null;
  url: string;
  imageUrl?: string | null;
  organization: OrgInfo;
}) {
  return {
    "@type": "Service",
    name,
    ...(description ? { description } : {}),
    url,
    ...(imageUrl ? { image: imageUrl } : {}),
    provider: { "@id": `${organization.siteUrl}/#organization` },
    areaServed: "MR",
  };
}

export function buildLocalBusinessSchema({
  org,
  latitude,
  longitude,
}: {
  org: OrgInfo;
  latitude?: number | null;
  longitude?: number | null;
}) {
  return {
    "@type": "LocalBusiness",
    "@id": `${org.siteUrl}/#localbusiness`,
    name: org.companyName,
    url: org.siteUrl,
    ...(org.logoUrl ? { image: org.logoUrl } : {}),
    ...(org.address ? { address: { "@type": "PostalAddress", streetAddress: org.address, addressCountry: "MR" } } : {}),
    ...(latitude != null && longitude != null
      ? { geo: { "@type": "GeoCoordinates", latitude, longitude } }
      : {}),
    ...(org.phones && org.phones.length > 0 ? { telephone: org.phones[0] } : {}),
    ...(org.email ? { email: org.email } : {}),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Every JSON-LD block on a page shares one `@context` — wrap the page's own
// list of schema objects in a `@graph` so multiple types (e.g. Article +
// BreadcrumbList) can share one <script> tag instead of one per type.
export function jsonLdGraph(nodes: object[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
