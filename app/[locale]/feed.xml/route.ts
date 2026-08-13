import { listArticlesPublic } from "@/server/queries/articles";
import { listNewsPublic } from "@/server/queries/news";
import { getSiteUrl } from "@/lib/site-url";
import { LOCALES, type LocaleCode } from "@/lib/validation/locale";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type FeedItem = { title: string; url: string; publishedAt: Date | null; excerpt: string | null; category: "Article" | "Actualité" };

// One feed per locale — RSS has no concept of per-item language, so mixing
// locales in one feed isn't meaningful; each feed only ever lists that
// locale's own published articles and news (the same
// publications-independence rule applied to the index/search/sitemap).
// Articles and news are merged and re-sorted by publish date, each
// carrying its own <category> so a feed reader can still tell them apart.
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(LOCALES as readonly string[]).includes(locale)) {
    return new Response("Not found", { status: 404 });
  }
  const typedLocale = locale as LocaleCode;

  const [siteUrl, articles, news] = await Promise.all([
    getSiteUrl(),
    listArticlesPublic({ locale: typedLocale, page: 1 }),
    listNewsPublic({ locale: typedLocale, page: 1 }),
  ]);
  const base = siteUrl.replace(/\/$/, "");
  const feedUrl = `${base}/${typedLocale}/feed.xml`;

  const items: FeedItem[] = [
    ...articles.items.map((item) => ({
      title: item.title,
      url: `${base}/${typedLocale}/articles/${item.slug}`,
      publishedAt: item.publishedAt,
      excerpt: item.excerpt,
      category: "Article" as const,
    })),
    ...news.items.map((item) => ({
      title: item.title,
      url: `${base}/${typedLocale}/actualites/${item.slug}`,
      publishedAt: item.news.eventDate ?? item.publishedAt,
      excerpt: item.excerpt,
      category: "Actualité" as const,
    })),
  ].sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));

  const itemsXml = items
    .map(
      (item) => `<item>
<title>${escapeXml(item.title)}</title>
<link>${item.url}</link>
<guid>${item.url}</guid>
<category>${escapeXml(item.category)}</category>
${item.publishedAt ? `<pubDate>${item.publishedAt.toUTCString()}</pubDate>` : ""}
${item.excerpt ? `<description>${escapeXml(item.excerpt)}</description>` : ""}
</item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml("GeoExplorer Services")}</title>
<link>${base}/${typedLocale}</link>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${feedUrl}" rel="self" type="application/rss+xml"/>
<description>${escapeXml("Articles et actualités — GeoExplorer Services")}</description>
${itemsXml}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
