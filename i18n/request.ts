import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";
import type { LocaleCode } from "@/lib/validation/locale";

function isSupportedLocale(value: string | undefined): value is LocaleCode {
  return value != null && (routing.locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isSupportedLocale(requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
