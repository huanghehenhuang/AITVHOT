// Names, dates and grouping for daily, weekly and monthly reports.
import type { ReportNavigationEntry, ReportKind } from "@aihot/contracts/site";
import { beijingDate, beijingWeekday, isoWeekLabel, isoWeekRange } from "@aihot/contracts/time";
import { EDITION_WHEN, REPORTS, SITE, subjectAfter } from "@aihot/site";
import { RELEASE } from "@aihot/industry/taxonomy";
import { EN } from "../../i18n/en.ts";
import { extra as reportExtra } from "../../i18n/extra/report.ts";
import type { Locale } from "../../i18n/locale.ts";
import { monthDay, weekdayShort } from "../../lib/format.ts";

// i18n/index.tsx is JSX, which the node tests that import this file cannot load. Same lookup as translate().
function translate(locale: Locale, zh: string, vars?: Record<string, string | number>): string {
  let s = locale === "en" ? (reportExtra[zh] ?? EN[zh] ?? zh) : zh;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthVars(m: number): { m: number; M: string; Month: string } {
  return { m, M: MONTH_SHORT[m - 1] ?? String(m), Month: MONTH_FULL[m - 1] ?? String(m) };
}

export const KINDS: ReportKind[] = ["daily", "weekly", "monthly"];
export const KIND_PATH: Record<ReportKind, string> = { daily: "/daily", weekly: "/weekly", monthly: "/monthly" };
export const KIND_LABEL: Record<ReportKind, string> = { daily: "日报", weekly: "周报", monthly: "月报" };

export function kindFromPath(pathname: string): ReportKind {
  if (pathname.startsWith("/weekly")) return "weekly";
  if (pathname.startsWith("/monthly")) return "monthly";
  return "daily";
}

/** The kind's RSS feed, announced in the page head so a reader given the page finds it. */
export function feedLink(kind: ReportKind, locale: Locale = "zh") {
  return { tagName: "link", rel: "alternate", type: "application/rss+xml", title: `${SITE.name} ${translate(locale, KIND_LABEL[kind])}`, href: `/feed/${kind}.xml` } as const;
}

export function reportPath(kind: ReportKind, key: string): string {
  return `${KIND_PATH[kind]}/${key}`;
}

const pad = (n: number) => String(n).padStart(2, "0");

const { measure, noun } = REPORTS.entry;
/** "件大事": what an issue counts its entries in, in the site's words (REPORTS.entry). */
export const ENTRIES_UNIT = `${measure}${noun}`;

/** "这一天的 4 件 AI 大事" / "本周的 12 件 AI 大事" / "8 月的 20 件 AI 大事" (the subject and REPORTS.entry from site/site.ts). */
export function headline(kind: ReportKind, key: string, count: number, locale: Locale = "zh"): string {
  if (kind === "daily") return translate(locale, subjectAfter(`这一天的 {n} ${measure}`, noun), { n: count });
  if (kind === "weekly") return translate(locale, subjectAfter(`本周的 {n} ${measure}`, noun), { n: count });
  const m = Number(key.slice(5, 7));
  return translate(locale, subjectAfter(`{m} 月的 {n} ${measure}`, noun), { n: count, ...monthVars(m) });
}

/** "09.16" for a story inside a week or month. */
export function shortDay(iso: string): string {
  return beijingDate(iso).slice(5).replace("-", ".");
}

export interface ArchiveGroup {
  id: string;
  label: string;
  entries: Array<ReportNavigationEntry & { short: string }>;
}

/**
 * The archive column: days grouped by month, weeks by the month their Monday falls in ("第2周"),
 * months by year. Newest first, as the index comes.
 */
export function archiveGroups(kind: ReportKind, index: ReportNavigationEntry[], locale: Locale = "zh"): ArchiveGroup[] {
  const groups: ArchiveGroup[] = [];
  const push = (id: string, label: string, e: ReportNavigationEntry & { short: string }) => {
    const g = groups[groups.length - 1];
    if (g && g.id === id) g.entries.push(e);
    else groups.push({ id, label, entries: [e] });
  };
  const yearMonth = (ym: string) => translate(locale, "{y} 年 {m} 月", { y: ym.slice(0, 4), ...monthVars(Number(ym.slice(5))) });
  if (kind === "weekly") {
    const byMonth = new Map<string, string[]>();
    for (const e of index) {
      const m = isoWeekRange(e.key)!.start.slice(0, 7);
      byMonth.set(m, [...(byMonth.get(m) ?? []), e.key]);
    }
    for (const e of index) {
      const m = isoWeekRange(e.key)!.start.slice(0, 7);
      const weeks = [...byMonth.get(m)!].sort();
      push(m, yearMonth(m), { ...e, short: translate(locale, "第{n}周", { n: weeks.indexOf(e.key) + 1 }) });
    }
    return groups;
  }
  for (const e of index) {
    if (kind === "daily") push(e.key.slice(0, 7), yearMonth(e.key.slice(0, 7)), { ...e, short: translate(locale, "{n} 日", { n: Number(e.key.slice(8, 10)) }) });
    else push(e.key.slice(0, 4), translate(locale, "{y} 年", { y: e.key.slice(0, 4) }), { ...e, short: translate(locale, "{m} 月", monthVars(Number(e.key.slice(5, 7)))) });
  }
  return groups;
}

/** An issue's mark in the archive column: a large number over a small word (a month's number stands alone). */
export function archiveMark(kind: ReportKind, key: string, locale: Locale = "zh"): { big: string; small: string | null } {
  if (kind === "daily") return { big: key.slice(8, 10), small: weekdayShort(key, locale) };
  if (kind === "weekly") {
    const { start } = isoWeekRange(key)!;
    const md = `${Number(start.slice(5, 7))}.${Number(start.slice(8, 10))}`;
    return { big: key.slice(6), small: translate(locale, "{md} 起", { md }) };
  }
  return { big: key.slice(5, 7), small: null };
}

/** Short chip label for the phone switcher: "今天", "9月26日", "9月第2周", "8 月". */
export function chipLabel(kind: ReportKind, key: string, index: ReportNavigationEntry[], today: string, locale: Locale = "zh"): string {
  if (kind === "daily") return key === today ? translate(locale, "今天") : monthDay(key, locale);
  if (kind === "monthly") return translate(locale, "{m} 月", monthVars(Number(key.slice(5, 7))));
  const start = isoWeekRange(key)?.start;
  if (!start) return key;
  const month = start.slice(0, 7);
  const weeks = index.map((e) => e.key).filter((k) => isoWeekRange(k)!.start.slice(0, 7) === month).sort();
  const n = weeks.indexOf(key) + 1;
  if (n <= 0) return key;
  return translate(locale, "{m}月第{n}周", { n, ...monthVars(Number(month.slice(5))) });
}

/**
 * "第 N 期": the issue's place in its series as the server counts it over every issue. The navigation
 * index holds only the newest issues, so its length cannot tell.
 */
export function issueNumber(index: ReportNavigationEntry[], key: string): number | null {
  return index.find((e) => e.key === key)?.issueNumber ?? null;
}

/** The masthead's date block: a large figure and two small lines beside it. */
export function dateMark(kind: ReportKind, key: string, locale: Locale = "zh"): { figure: string; top: string; bottom: string } {
  if (kind === "daily") return { figure: key.slice(8, 10), top: translate(locale, "{y} 年 {m} 月", { y: key.slice(0, 4), ...monthVars(Number(key.slice(5, 7))) }), bottom: translate(locale, beijingWeekday(key)) };
  if (kind === "weekly") {
    const { start, end } = isoWeekRange(key)!;
    return { figure: key.slice(6), top: translate(locale, "{y} 年第 {w} 周", { y: key.slice(0, 4), w: Number(key.slice(6)) }), bottom: `${start.slice(5).replace("-", ".")} — ${end.slice(5).replace("-", ".")}` };
  }
  return { figure: key.slice(5, 7), top: translate(locale, "{y} 年", { y: key.slice(0, 4) }), bottom: translate(locale, "{m} 月", monthVars(Number(key.slice(5, 7)))) };
}

/** When each kind comes out, for the masthead (the times are the site's, EDITION_WHEN). */
export const EDITION: Record<ReportKind, string> = { daily: `${EDITION_WHEN.daily} 出刊`, weekly: "每周一出刊", monthly: "每月 1 日出刊" };

export function edition(kind: ReportKind, locale: Locale = "zh"): string {
  return translate(locale, EDITION[kind]);
}

/**
 * The masthead's figures, in the order a reader wants them, in the site's words (REPORTS). Releases of the
 * pack's headline launch kind (RELEASE, "个新模型" for AI) count only where the pack has one; zero is left out.
 */
const UNITS = REPORTS.metricUnits;
const METRICS: Array<[key: string, unit: string]> = [
  ["totalEvents", ENTRIES_UNIT],
  ["totalStories", ENTRIES_UNIT],
  ["sourcesCount", UNITS.sourcesCount],
  ["firstPartyEvents", UNITS.firstPartyEvents],
  ...(RELEASE ? [["modelsReleased", RELEASE.unit] as [string, string]] : []),
  ["selectedCount", UNITS.selectedCount],
  ["reportsCovered", UNITS.reportsCovered],
];
export function metricItems(metrics: Record<string, number>): Array<{ value: number; unit: string }> {
  return METRICS.filter(([k]) => typeof metrics[k] === "number" && (k !== "modelsReleased" || metrics[k]! > 0)).map(([k, unit]) => ({ value: metrics[k]!, unit }));
}

/** "前一日 · 9月25日", "上一期 · 第 37 周", "下一期 · 7 月". */
export function neighbourLabel(kind: ReportKind, key: string, direction: "prev" | "next", locale: Locale = "zh"): string {
  if (kind === "daily") return translate(locale, `${direction === "prev" ? "前一日" : "后一日"} · {date}`, { date: monthDay(key, locale) });
  const which = direction === "prev" ? "上一期" : "下一期";
  if (kind === "weekly") return translate(locale, `${which} · 第 {n} 周`, { n: Number(key.slice(6)) });
  return translate(locale, `${which} · {m} 月`, monthVars(Number(key.slice(5, 7))));
}

const CN = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
/** Page numbers as a Chinese paper prints them: 1 → 一, 12 → 十二, 20 → 二十. */
function cnNumber(n: number): string {
  if (n <= 10) return CN[n]!;
  if (n < 20) return `十${CN[n - 10]}`;
  return `${CN[Math.floor(n / 10)]}十${n % 10 ? CN[n % 10] : ""}`;
}

/** The line above the nameplate: "2026 年 9 月 26 日 · 星期六", "2026 年第 38 周 · 09.14 — 09.20", "2026 年 8 月". */
export function dateLine(kind: ReportKind, key: string, locale: Locale = "zh"): string {
  if (kind === "daily") {
    return translate(locale, "{y} 年 {m} 月 {d} 日 · {w}", {
      y: key.slice(0, 4),
      d: Number(key.slice(8, 10)),
      w: translate(locale, beijingWeekday(key)),
      ...monthVars(Number(key.slice(5, 7))),
    });
  }
  if (kind === "weekly") {
    const { start, end } = isoWeekRange(key)!;
    return translate(locale, "{y} 年第 {w} 周 · {range}", {
      y: key.slice(0, 4),
      w: Number(key.slice(6)),
      range: `${start.slice(5).replace("-", ".")} — ${end.slice(5).replace("-", ".")}`,
    });
  }
  return translate(locale, "{y} 年 {m} 月", { y: key.slice(0, 4), ...monthVars(Number(key.slice(5, 7))) });
}

/** What each kind is, under its nameplate. */
export const MOTTO: Record<ReportKind, string> = { daily: `${REPORTS.motto} · 每日要闻`, weekly: `${REPORTS.motto} · 每周综述`, monthly: `${REPORTS.motto} · 每月盘点` };

export function motto(kind: ReportKind, locale: Locale = "zh"): string {
  return translate(locale, MOTTO[kind]);
}

/** The quiet-day title, or a lead paragraph copied from REPORTS.quiet; anything else is returned as written. */
export function quietText(text: string, locale: Locale = "zh"): string {
  if (text === REPORTS.quiet.title) return translate(locale, text);
  const template = REPORTS.quiet.paragraph;
  const startAt = template.indexOf("{start}");
  const endAt = template.indexOf("{end}");
  if (startAt < 0 || endAt < 0) return text;
  const head = template.slice(0, startAt);
  const mid = template.slice(startAt + "{start}".length, endAt);
  const tail = template.slice(endAt + "{end}".length);
  if (!text.startsWith(head) || !text.endsWith(tail)) return text;
  const body = text.slice(head.length, text.length - tail.length);
  const cut = body.indexOf(mid);
  if (cut < 0) return text;
  const point = (value: string) => {
    if (locale !== "en") return value;
    const match = /^(\d+) 月 (\d+) 日 (\d{2}:\d{2})$/.exec(value);
    return match ? `${MONTH_SHORT[Number(match[1]) - 1] ?? match[1]} ${Number(match[2])}, ${match[3]}` : value;
  };
  return translate(locale, template, { start: point(body.slice(0, cut)), end: point(body.slice(cut + mid.length)) });
}

export interface PeriodCell {
  key: string | null;
  /** Hover text: "9月26日 · 第 158 期". */
  label: string;
  state: "current" | "issue" | "none" | "pad";
}

/**
 * The dot grid beside the date in the masthead: the days of this issue's month (dailies, Monday first),
 * the weeks of its year (weeklies) or the months of its year (monthlies), each marked as this issue,
 * an issue that exists, or none. This issue's own number (`current`) labels it, also when it is older
 * than the navigation.
 */
export function periodGrid(kind: ReportKind, key: string, index: ReportNavigationEntry[], current: number, locale: Locale = "zh"): { title: string; note: string; columns: number; heads: string[] | null; cells: PeriodCell[] } {
  const exists = new Set(index.map((e) => e.key));
  const cell = (k: string, name: string): PeriodCell => {
    const n = k === key ? current : issueNumber(index, k);
    const label = n ? translate(locale, "{name} · 第 {n} 期", { name, n }) : translate(locale, "{name} · 未出刊", { name });
    return { key: k, label, state: k === key ? "current" : exists.has(k) ? "issue" : "none" };
  };
  const count = (cells: PeriodCell[]) => cells.filter((c) => c.state === "issue" || c.state === "current").length;
  const year = key.slice(0, 4);
  if (kind === "daily") {
    const m = Number(key.slice(5, 7));
    const days = new Date(Date.UTC(Number(year), m, 0)).getUTCDate();
    const lead = (new Date(Date.UTC(Number(year), m - 1, 1)).getUTCDay() + 6) % 7;
    const cells: PeriodCell[] = [
      ...Array.from({ length: lead }, (): PeriodCell => ({ key: null, label: "", state: "pad" })),
      ...Array.from({ length: days }, (_, i) => {
        const day = `${key.slice(0, 7)}-${pad(i + 1)}`;
        return cell(day, monthDay(day, locale));
      }),
    ];
    return { title: translate(locale, `${cnNumber(m)}月`), note: translate(locale, "本月 {n} 期", { n: count(cells) }), columns: 7, heads: locale === "en" ? ["M", "T", "W", "T", "F", "S", "S"] : ["一", "二", "三", "四", "五", "六", "日"], cells };
  }
  if (kind === "weekly") {
    // 28 December always falls in its year's last ISO week.
    const weeks = Number(isoWeekLabel(`${year}-12-28`).slice(6));
    const cells = Array.from({ length: weeks }, (_, i) => {
      const k = `${year}-W${pad(i + 1)}`;
      const { start, end } = isoWeekRange(k)!;
      const name = translate(locale, "第 {n} 周（{start}—{end}）", { n: i + 1, start: start.slice(5).replace("-", "."), end: end.slice(5).replace("-", ".") });
      return cell(k, name);
    });
    return { title: translate(locale, "{y} 年", { y: year }), note: translate(locale, "全年 {n} 期", { n: count(cells) }), columns: 13, heads: null, cells };
  }
  const cells = Array.from({ length: 12 }, (_, i) => cell(`${year}-${pad(i + 1)}`, translate(locale, "{m} 月", monthVars(i + 1))));
  return { title: translate(locale, "{y} 年", { y: year }), note: translate(locale, "全年 {n} 期", { n: count(cells) }), columns: 6, heads: null, cells };
}
