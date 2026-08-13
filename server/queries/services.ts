import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/server/db";
import { TAGS, CACHE_PROFILE } from "@/lib/cache-tags";
import { resolveStructural } from "@/lib/locale";
import type { LocaleCode } from "@/lib/validation/locale";

// The five fixed service lines (no create flow — admin only edits what the
// seed already created), read in full for the admin list and its reorder
// control.
export async function listServicesAdmin() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services);

  return db.service.findMany({
    orderBy: { order: "asc" },
    include: { hero: true, translations: true },
  });
}

export async function getServiceForEdit(id: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services);

  return db.service.findUnique({
    where: { id },
    include: { hero: true, translations: true, blocks: { orderBy: { order: "asc" } } },
  });
}

// Public teaser list — any number of published lines, growable (the
// fixed-five assumption was later dropped). Structural, so a missing
// translation resolves through resolveStructural rather than being
// omitted — never silently drop a service because one locale lags.
export async function listServicesPublic(locale: LocaleCode) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services);

  const services = await db.service.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      slug: true,
      icon: true,
      hero: { select: { publicId: true, blurDataUrl: true, alt: true } },
      translations: true,
    },
  });

  return services.map((service) => {
    const { row, isFallback } = resolveStructural(service.translations, locale);
    return {
      id: service.id,
      slug: service.slug,
      icon: service.icon,
      hero: service.hero,
      title: row?.title ?? "",
      tagline: row?.tagline ?? null,
      summary: row?.summary ?? null,
      isFallback,
    };
  });
}

// Public detail read for /services/[slug]. Returns null for both an unknown
// slug and an unpublished one — the route layer resolves either to
// notFound() uniformly, never distinguishing "doesn't exist" from "exists
// but unpublished" (the never-confirm-existence rule applies to structural
// content too).
export async function getServicePublicBySlug(locale: LocaleCode, slug: string) {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services, TAGS.service(locale, slug));

  const service = await db.service.findUnique({
    where: { slug },
    include: { hero: true, translations: true, blocks: { orderBy: { order: "asc" } } },
  });
  if (!service || !service.published) return null;

  const { row, isFallback } = resolveStructural(service.translations, locale);
  if (!row) return null;

  return {
    id: service.id,
    slug: service.slug,
    icon: service.icon,
    hero: service.hero,
    blocks: service.blocks,
    title: row.title,
    tagline: row.tagline,
    summary: row.summary,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    isFallback,
  };
}

// Backs /[locale]/services/[slug]'s generateStaticParams.
// `published` lives on the Service parent, not per-translation, so the slug
// set is identical across all three locales — no locale param needed, unlike
// the per-locale article/news equivalents. Same placeholder pattern as
// listPublishedSlugsForStaticParams for the (currently impossible, but
// defensively handled) zero-published-services case.
export async function listPublishedServiceSlugsForStaticParams(): Promise<string[]> {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services);

  const rows = await db.service.findMany({ where: { published: true }, select: { slug: true } });
  return rows.length > 0 ? rows.map((row) => row.slug) : ["__none__"];
}

// Backs app/sitemap.ts — structural content, so unlike articles/news
// there's no per-locale published set to intersect: every
// published service renders (via resolveStructural's FR fallback) under
// all three locale segments.
export async function listPublishedServicesForSitemap() {
  "use cache";
  cacheLife(CACHE_PROFILE);
  cacheTag(TAGS.services);

  return db.service.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } });
}
