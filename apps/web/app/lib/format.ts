import { beijingDate, beijingTime, beijingWeekday } from "@aihot/contracts/time";
import type { Locale } from "../i18n/locale.ts";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function enCount(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many} ago`;
}

/** "9月28日" / "Sep 28" of a calendar date (YYYY-MM-DD). */
export function monthDay(date: string, locale: Locale = "zh"): string {
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  if (locale === "en") return `${MONTHS_EN[month - 1] ?? month} ${day}`;
  return `${month}月${day}日`;
}

/** "周六" / "Sat" of a calendar date (YYYY-MM-DD). */
export function weekdayShort(date: string, locale: Locale = "zh"): string {
  if (locale === "en") return WEEKDAYS_EN[new Date(`${date}T00:00:00Z`).getUTCDay()] ?? date;
  return beijingWeekday(date).replace("星期", "周");
}

export function relativeTime(iso: string, now = Date.now(), locale: Locale = "zh"): string {
  const t = Date.parse(iso);
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (locale === "en") {
    if (s < 60) return "Just now";
    const m = Math.round(s / 60);
    if (m < 60) return enCount(m, "minute", "minutes");
    const h = Math.round(m / 60);
    if (h < 24) return enCount(h, "hour", "hours");
    const d = Math.round(h / 24);
    if (d < 30) return enCount(d, "day", "days");
    return beijingDate(iso);
  }
  if (s < 60) return "刚刚";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} 分钟前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} 天前`;
  return beijingDate(iso);
}

export function fullDateTime(iso: string, locale: Locale = "zh"): string {
  const date = beijingDate(iso);
  const time = beijingTime(iso);
  if (locale === "en") return `${monthDay(date, "en")} ${date.slice(0, 4)}, ${time}`;
  return `${date} ${time}`;
}

/** "9月24日 10:51" / "Sep 24 10:51" (Beijing), for lists that span days. */
export function monthDayTime(iso: string, locale: Locale = "zh"): string {
  return `${monthDay(beijingDate(iso), locale)} ${beijingTime(iso)}`;
}

export function sourceInitial(name: string): string {
  const s = name.replace(/^[^\p{L}\p{N}]+/u, "");
  return (s[0] ?? "A").toUpperCase();
}
