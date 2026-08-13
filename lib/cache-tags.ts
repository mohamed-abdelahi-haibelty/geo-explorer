import type { LocaleCode } from "@/lib/validation/locale";

// `articles`/`news`/`services`/`page` (flat) cover the admin's all-locale
// views; the `*List`/`article`/`newsItem`/`service`/`page` locale-scoped
// variants cover the public surface. Every translation write invalidates
// both — the flat tag so the admin always sees its own write, the
// locale-scoped tag(s) so publishing e.g. the Arabic translation never
// invalidates the French page's cache.
export const TAGS = {
  articles: "articles",
  articleList: (locale: LocaleCode) => `articles:${locale}`,
  article: (locale: LocaleCode, slug: string) => `article:${locale}:${slug}`,
  authors: "authors",
  news: "news",
  newsList: (locale: LocaleCode) => `news:${locale}`,
  newsItem: (locale: LocaleCode, slug: string) => `news:${locale}:${slug}`,
  services: "services",
  service: (locale: LocaleCode, slug: string) => `service:${locale}:${slug}`,
  partners: "partners",
  settings: "settings",
  page: (locale: LocaleCode, key: string) => `page:${locale}:${key}`,
  messages: "messages",
  media: "media",
};

// Content is edited rarely and read often.
export const CACHE_PROFILE = "hours";
