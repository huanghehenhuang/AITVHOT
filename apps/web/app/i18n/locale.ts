// Reader locale for the public site. Chinese is the default and keeps every existing address.
// English is explicit: ?lang=en, or the locale cookie the switcher sets. Published articles,
// reports, RSS, share images and MCP stay in the language they were written (Chinese).
export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

/** ?lang= wins, then the cookie, otherwise Chinese. Admin stays Chinese. */
export function resolveLocale(request: Request): Locale {
  const url = new URL(request.url);
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return DEFAULT_LOCALE;
  const query = url.searchParams.get("lang");
  if (isLocale(query)) return query;
  const match = request.headers.get("cookie")?.match(/(?:^|;\s*)locale=(zh|en)(?:;|$)/);
  return isLocale(match?.[1]) ? match[1] : DEFAULT_LOCALE;
}

export function localeCookie(locale: Locale): string {
  return `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

/** html lang and JSON-LD inLanguage. */
export function localeTag(locale: Locale): "zh-CN" | "en" {
  return locale === "en" ? "en" : "zh-CN";
}

/** og:locale. */
export function ogLocale(locale: Locale): "zh_CN" | "en_US" {
  return locale === "en" ? "en_US" : "zh_CN";
}

/**
 * Fixes a publicly cached Chinese document opened by a reader who already chose English:
 * ?lang=en is a different cache key, so the reload is rendered in English and not stored.
 * Also records ?lang= into the cookie. Skips the admin, which stays Chinese.
 */
export const LOCALE_BOOT_SCRIPT = `(function(){if(location.pathname==="/admin"||location.pathname.indexOf("/admin/")===0)return;var q=new URLSearchParams(location.search).get("lang");if(q==="en"||q==="zh"){document.cookie="${LOCALE_COOKIE}="+q+"; Path=/; Max-Age=31536000; SameSite=Lax";return}var m=document.cookie.match(/(?:^|; )${LOCALE_COOKIE}=(en|zh)/);if(m&&m[1]==="en"&&document.documentElement.lang!=="en"){var u=new URL(location.href);u.searchParams.set("lang","en");location.replace(u.pathname+u.search+u.hash)}})();`;
