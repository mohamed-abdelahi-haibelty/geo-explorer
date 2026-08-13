import type { MetadataRoute } from "next";
import { listPublishedArticleTranslationsForSitemap } from "@/server/queries/articles";
import { listPublishedNewsTranslationsForSitemap } from "@/server/queries/news";
import { listPublishedAuthorSlugsWithLocalesForSitemap } from "@/server/queries/authors";
import { listPublishedServicesForSitemap } from "@/server/queries/services";
import { getSiteUrl } from "@/lib/site-url";
import { fromDbLocale } from "@/lib/locale";
import { LOCALES } from "@/lib/validation/locale";

// Static routes with identical content across all three locales (structural
// pages, not publications) — same "all three locales, x-default → FR"
// alternates shape as the home entries below.
const STATIC_PATHS = ["a-propos", "services", "contact", "mentions-legales"];

// One sitemap covering all three locales, not one per locale — entries
// carry their own `alternates.languages` per URL. Article URLs only ever
// list the locales that article is actually published in ("exclude missing
// locales" — reciprocal by construction, since every group is built from
// the same translation set).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (await getSiteUrl()).replace(/\/$/, "");

  const homeLanguages = { ...Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}`])), "x-default": `${siteUrl}/fr` };
  const homeEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    alternates: { languages: homeLanguages },
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap((path) => {
    const languages = {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}/${path}`])),
      "x-default": `${siteUrl}/fr/${path}`,
    };
    return LOCALES.map((locale) => ({ url: `${siteUrl}/${locale}/${path}`, alternates: { languages } }));
  });

  const services = await listPublishedServicesForSitemap();
  const serviceEntries: MetadataRoute.Sitemap = services.flatMap((service) => {
    const languages = {
      ...Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}/services/${service.slug}`])),
      "x-default": `${siteUrl}/fr/services/${service.slug}`,
    };
    return LOCALES.map((locale) => ({
      url: `${siteUrl}/${locale}/services/${service.slug}`,
      lastModified: service.updatedAt,
      alternates: { languages },
    }));
  });

  const translations = await listPublishedArticleTranslationsForSitemap();
  const byArticle = new Map<string, typeof translations>();
  for (const translation of translations) {
    const group = byArticle.get(translation.articleId) ?? [];
    group.push(translation);
    byArticle.set(translation.articleId, group);
  }

  const articleEntries: MetadataRoute.Sitemap = [];
  for (const group of byArticle.values()) {
    const languages = Object.fromEntries(
      group.map((t) => [fromDbLocale(t.locale), `${siteUrl}/${fromDbLocale(t.locale)}/articles/${t.slug}`]),
    );
    const frArticle = group.find((t) => fromDbLocale(t.locale) === "fr");
    if (frArticle) languages["x-default"] = `${siteUrl}/fr/articles/${frArticle.slug}`;
    for (const t of group) {
      articleEntries.push({
        url: `${siteUrl}/${fromDbLocale(t.locale)}/articles/${t.slug}`,
        lastModified: t.updatedAt,
        alternates: { languages },
      });
    }
  }

  // News mirrors the article group-by-parent shape exactly — reciprocal
  // hreflang alternates built from each item's own published-locale set,
  // never all three unconditionally.
  const newsTranslations = await listPublishedNewsTranslationsForSitemap();
  const byNews = new Map<string, typeof newsTranslations>();
  for (const translation of newsTranslations) {
    const group = byNews.get(translation.newsId) ?? [];
    group.push(translation);
    byNews.set(translation.newsId, group);
  }

  const newsEntries: MetadataRoute.Sitemap = [];
  for (const group of byNews.values()) {
    const languages = Object.fromEntries(
      group.map((t) => [fromDbLocale(t.locale), `${siteUrl}/${fromDbLocale(t.locale)}/actualites/${t.slug}`]),
    );
    const frNews = group.find((t) => fromDbLocale(t.locale) === "fr");
    if (frNews) languages["x-default"] = `${siteUrl}/fr/actualites/${frNews.slug}`;
    for (const t of group) {
      newsEntries.push({
        url: `${siteUrl}/${fromDbLocale(t.locale)}/actualites/${t.slug}`,
        lastModified: t.updatedAt,
        alternates: { languages },
      });
    }
  }

  // Author profiles — one entry per locale the author actually has a
  // published article in (never a locale with nothing to show).
  const authors = await listPublishedAuthorSlugsWithLocalesForSitemap();
  const authorEntries: MetadataRoute.Sitemap = [];
  for (const author of authors) {
    const languages = Object.fromEntries(author.locales.map((locale) => [locale, `${siteUrl}/${locale}/auteurs/${author.slug}`]));
    for (const locale of author.locales) {
      authorEntries.push({
        url: `${siteUrl}/${locale}/auteurs/${author.slug}`,
        lastModified: author.updatedAt,
        alternates: { languages },
      });
    }
  }

  return [...homeEntries, ...staticEntries, ...serviceEntries, ...articleEntries, ...newsEntries, ...authorEntries];
}
