import { monthDay, weekdayShort } from "../../lib/format";
import { translate, useI18n, type Locale } from "../../i18n";

/** Release notes carry a little Markdown: **bold** runs. */
export function Inline({ text }: { text: string }) {
  const { t } = useI18n();
  const shown = t(text);
  return <>{shown.split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i} className="font-semibold text-ink-2">{part}</b> : part))}</>;
}

export function dateHeading(date: string, locale: Locale = "zh"): { label: string; weekday: string } {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const label = locale === "en" ? `${monthDay(date, "en")}, ${y}` : translate(locale, "{y} 年 {m} 月 {d} 日", { y, m, d });
  return { label, weekday: weekdayShort(date, locale) };
}
