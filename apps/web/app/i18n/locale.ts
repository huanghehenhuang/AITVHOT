import { isbot } from "isbot";
// Explicit URLs and saved choices win. Browser language and trusted edge country are first-visit hints.
export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: unknown): value is Locale {
  return value === "zh" || value === "en";
}

export function browserLocale(header: string | null): Locale | null {
  const choices = (header ?? "").split(",").map((part, order) => {
    const [tag, ...params] = part.trim().split(";");
    const raw = params.find((p) => p.trim().startsWith("q="))?.trim().slice(2);
    const quality = raw === undefined ? 1 : Number(raw);
    return { tag: tag?.toLowerCase(), quality, order };
  }).filter((v) => Number.isFinite(v.quality) && v.quality > 0 && v.quality <= 1)
    .sort((a, b) => b.quality - a.quality || a.order - b.order);
  for (const { tag } of choices) {
    if (/^zh(?:-|$)/.test(tag ?? "")) return "zh";
    if (/^en(?:-|$)/.test(tag ?? "")) return "en";
  }
  return null;
}

/** Admin stays Chinese; crawlers have a deterministic default and can crawl explicit English URLs. */
export function resolveLocale(request: Request, trustCountry = false): Locale {
  const url = new URL(request.url);
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) return DEFAULT_LOCALE;
  const query = url.searchParams.get("lang");
  if (isLocale(query)) return query;
  const match = request.headers.get("cookie")?.match(/(?:^|;\s*)locale=(zh|en)(?:;|$)/);
  if (isLocale(match?.[1])) return match[1];
  if (isbot(request.headers.get("user-agent") ?? "")) return DEFAULT_LOCALE;
  const browser = browserLocale(request.headers.get("accept-language"));
  if (browser) return browser;
  const country = trustCountry ? request.headers.get("cf-ipcountry")?.toUpperCase() : null;
  if (country && /^[A-Z]{2}$/.test(country) && country !== "XX") return ["CN", "HK", "MO", "TW"].includes(country) ? "zh" : "en";
  return DEFAULT_LOCALE;
}

export function languagePath(path: string, locale: Locale): string {
  const url = new URL(`https://site.local${path.startsWith("/") ? path : `/${path}`}`);
  url.pathname = url.pathname.replace(/^\/{2,}/, "/");
  url.searchParams.delete("lang");
  if (locale === "en") url.searchParams.set("lang", "en");
  return url.pathname + url.search + url.hash;
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
