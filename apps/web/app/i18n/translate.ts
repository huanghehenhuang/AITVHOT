import { extra as feedExtra } from "./extra/feed.ts";
import { extra as itemExtra } from "./extra/item.ts";
import { extra as pagesExtra } from "./extra/pages.ts";
import { extra as reportExtra } from "./extra/report.ts";
import { extra as uiExtra } from "./extra/ui.ts";
import { EN } from "./en.ts";
import type { Locale } from "./locale.ts";

export type Vars = Record<string, string | number>;

const EXTRA: Record<string, string> = { ...feedExtra, ...itemExtra, ...reportExtra, ...pagesExtra, ...uiExtra };

/** English for a Chinese source string; unknown strings stay Chinese. `{name}` is replaced from vars. */
export function translate(locale: Locale, zh: string, vars?: Vars): string {
  let s = locale === "en" ? (EXTRA[zh] ?? EN[zh] ?? zh) : zh;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}
