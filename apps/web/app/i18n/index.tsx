import { createContext, useContext, useMemo, type ReactNode } from "react";
import { fullDateTime, monthDay, monthDayTime, relativeTime, weekdayShort } from "../lib/format.ts";
import { categoryLabel, channelLabel, tagLabel } from "./labels.ts";
import { translate, type Vars } from "./translate.ts";
import { DEFAULT_LOCALE, isLocale, type Locale } from "./locale.ts";

export { categoryLabel, channelLabel, tagLabel };
export type { Locale };
export { DEFAULT_LOCALE, isLocale, localeCookie, localeTag, ogLocale, resolveLocale, LOCALE_BOOT_SCRIPT } from "./locale.ts";

export { translate, type Vars };

/** "3 篇报道" / "1 report" / "3 reports". `zh` already contains `{n}`. */
export function countLabel(locale: Locale, n: number, zh: string, enOne: string, enMany: string): string {
  if (locale !== "en") return zh.replaceAll("{n}", String(n));
  return (n === 1 ? enOne : enMany).replaceAll("{n}", String(n));
}

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useI18n() {
  const locale = useLocale();
  const t = useMemo(() => (zh: string, vars?: Vars) => translate(locale, zh, vars), [locale]);
  return { locale, t };
}

/** Locale from the root loader, for meta() and other functions that cannot use hooks. */
export function localeFromMatches(matches: ReadonlyArray<{ id?: string; data?: unknown; loaderData?: unknown } | null | undefined>): Locale {
  for (const match of matches) {
    if (!match || match.id !== "root") continue;
    const raw = match.loaderData ?? match.data;
    if (!raw || typeof raw !== "object") continue;
    const locale = (raw as { locale?: unknown }).locale;
    if (isLocale(locale)) return locale;
  }
  return DEFAULT_LOCALE;
}

export function useFormat() {
  const locale = useLocale();
  return {
    locale,
    relativeTime: (iso: string, now?: number) => relativeTime(iso, now, locale),
    monthDay: (date: string) => monthDay(date, locale),
    weekdayShort: (date: string) => weekdayShort(date, locale),
    monthDayTime: (iso: string) => monthDayTime(iso, locale),
    fullDateTime: (iso: string) => fullDateTime(iso, locale),
  };
}
