export const TAGS = {
  articles: "articles",
  article: (s: string) => `article:${s}`,
  news: "news",
  newsItem: (s: string) => `news:${s}`,
  services: "services",
  service: (s: string) => `service:${s}`,
  partners: "partners",
  settings: "settings",
  page: (p: string) => `page:${p}`,
  messages: "messages",
  media: "media",
};

// Content is edited rarely and read often — see architecture-full.md §11.
export const CACHE_PROFILE = "hours";
