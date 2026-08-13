import { ImageResponse } from "next/og";
import { getNewsBySlugForPublic } from "@/server/queries/news";
import { getSiteSetting } from "@/server/queries/settings";
import { buildArticleOgImage, OG_IMAGE_SIZE } from "@/lib/og-image";
import type { LocaleCode } from "@/lib/validation/locale";

export const alt = "GeoExplorer Services";
export const size = OG_IMAGE_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const typedLocale = locale as LocaleCode;
  const [news, settings] = await Promise.all([getNewsBySlugForPublic(typedLocale, slug), getSiteSetting()]);

  return new ImageResponse(
    buildArticleOgImage({
      title: news?.title ?? "GeoExplorer Services",
      locale: typedLocale,
      companyName: settings?.companyName ?? "GeoExplorer Services",
    }),
    size,
  );
}
