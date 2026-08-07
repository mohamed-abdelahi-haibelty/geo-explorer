import { listArticlesPublic } from "@/server/queries/articles";
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

// One feed per locale — RSS has no concept of per-item language, so mixing
// locales in one feed isn't meaningful; each feed only ever lists that
// locale's own published articles (Task 04a's publications-independence
// rule applies here exactly as it does to the index/search/sitemap).
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!(LOCALES as readonly string[]).includes(locale)) {
    return new Response("Not found", { status: 404 });
  }
  const typedLocale = locale as LocaleCode;

  const [siteUrl, { items }] = await Promise.all([
    getSiteUrl(),
    listArticlesPublic({ locale: typedLocale, page: 1 }),
  ]);
  const base = siteUrl.replace(/\/$/, "");
  const feedUrl = `${base}/${typedLocale}/feed.xml`;

  const itemsXml = items
    .map((item) => {
      const url = `${base}/${typedLocale}/articles/${item.slug}`;
      return `<item>
<title>${escapeXml(item.title)}</title>
<link>${url}</link>
<guid>${url}</guid>
${item.publishedAt ? `<pubDate>${item.publishedAt.toUTCString()}</pubDate>` : ""}
${item.excerpt ? `<description>${escapeXml(item.excerpt)}</description>` : ""}
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>${escapeXml("GeoExplorer Services")}</title>
<link>${base}/${typedLocale}</link>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${feedUrl}" rel="self" type="application/rss+xml"/>
<description>${escapeXml("Articles techniques — GeoExplorer Services")}</description>
${itemsXml}
</channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
