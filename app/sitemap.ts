import type { MetadataRoute } from "next";
import { listPublishedArticleTranslationsForSitemap } from "@/server/queries/articles";
import { getSiteUrl } from "@/lib/site-url";
import { fromDbLocale } from "@/lib/locale";
import { LOCALES } from "@/lib/validation/locale";

// One sitemap covering all three locales, not one per locale — entries
// carry their own `alternates.languages` per URL. Article URLs only ever
// list the locales that article is actually published in (Task 04a step
// 12: "exclude missing locales" — reciprocal by construction, since every
// group is built from the same translation set).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = (await getSiteUrl()).replace(/\/$/, "");

  const homeLanguages = Object.fromEntries(LOCALES.map((locale) => [locale, `${siteUrl}/${locale}`]));
  const homeEntries: MetadataRoute.Sitemap = LOCALES.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    alternates: { languages: homeLanguages },
  }));

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
    for (const t of group) {
      articleEntries.push({
        url: `${siteUrl}/${fromDbLocale(t.locale)}/articles/${t.slug}`,
        lastModified: t.updatedAt,
        alternates: { languages },
      });
    }
  }

  return [...homeEntries, ...articleEntries];
}
