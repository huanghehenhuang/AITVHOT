import { REPORTS, SITE } from "@aihot/site";
import { Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/topic";
import type { TopicPage } from "@aihot/contracts/site";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { breadcrumbLd, pageMeta, topicLd } from "../lib/seo";
import { DayList, Pagination } from "../features/feed/DayList";
import { BrandMark } from "../components/BrandMark";
import { EmptyState } from "../components/ui/Page";
import { IconArrowLeft } from "../components/icons";
import { beijingDate } from "@aihot/contracts/time";
import { monthDay } from "../lib/format";
import { PhoneBar } from "../components/shell/PhoneBar";
import { inNav } from "../components/shell/nav";
import type { Screen } from "../components/shell/screens";
import type { TopicPagePart } from "../modules";
import { loadParts } from "../site-modules";
import { localeFromMatches, translate, useFormat, useI18n, type Locale } from "../i18n";

export const handle: Screen = { home: inNav("/topics") ? "me" : "featured" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

/** Selected items of a topic: shared caches keep the page as long as its api answer (one minute). */
export async function loader({ params, request }: Route.LoaderArgs) {
  const page = params.page ? Number(params.page) : 1;
  if (params.page !== undefined && (!/^\d+$/.test(params.page) || page < 1)) throw new Response("Not found", { status: 404 });
  // Page 1 lives at the topic's own address (308).
  if (params.page === "1") throw redirect(`/topics/${params.slug}`, 308);
  const data = await loadOr404<TopicPage>(`/api/site/topics/${encodeURIComponent(params.slug)}?page=${page}`, { signal: request.signal });
  return cachedPage(60, { data });
}

const PARTS = await loadParts((m) => m.topicPage);

type Part = TopicPagePart & { key: string; data: unknown };

/** The modules' parts that have something on this page, in the site's order. */
function partsOf(data: TopicPage): Part[] {
  return PARTS.flatMap(({ name, part }) => {
    const value = data.modules[name];
    return value !== undefined && part.shows(value, data.topic) ? [{ ...part, key: name, data: value }] : [];
  });
}

/** The search snippet: what the topic covers, after when it last changed and its biggest recent events. */
function description(data: TopicPage, parts: Part[], locale: Locale): string {
  const { topic } = data;
  let text = topic.definition;
  const news = parts.flatMap((p) => p.news(p.data)).slice(0, 2).map((title) => title.replace(/[。.]$/u, "")).join("；");
  if (news && topic.latest) {
    const when = monthDay(beijingDate(topic.latest.at), locale);
    text = translate(locale, "{when}更新：{news}。{definition}", { when, news, definition: topic.definition });
  }
  return text.length > 150 ? `${text.slice(0, 149)}…` : text;
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  if (!loaderData) return [{ title: `${translate(locale, "主题不存在")} · ${SITE.name}` }, { name: "robots", content: "noindex" }];
  const data = loaderData.data;
  const { topic, page } = data;
  const parts = partsOf(data);
  const path = page > 1 ? `/topics/${topic.slug}/page/${page}` : `/topics/${topic.slug}`;
  const text = page > 1 ? translate(locale, "{name}的精选归档第 {page} 页。{definition}", { name: topic.name, page, definition: topic.definition }) : description(data, parts, locale);
  const list = parts.map((p) => p.name).join("、");
  const extra = parts.length ? (locale === "en" ? ` and ${parts.map((p) => translate(locale, p.name)).join(", ")}` : `与${list}`) : "";
  const crumbs = breadcrumbLd([{ name: SITE.name, path: "/" }, ...(inNav("/topics") ? [{ name: translate(locale, "主题"), path: "/topics" }] : []), { name: topic.name, path: `/topics/${topic.slug}` }]);
  return pageMeta({
    title: page > 1
      ? translate(locale, "{name} 精选 · 第 {page} 页", { name: topic.name, page })
      : translate(locale, "{name} 最新动态{extra}", { name: topic.name, extra }),
    description: text,
    path,
    image: `/og/topics/${topic.slug}.png`,
    noindex: !topic.indexable,
    locale,
    jsonLd: page > 1
      ? crumbs
      : [
          topicLd({
            path,
            name: translate(locale, "{name} 最新动态", { name: topic.name }),
            description: text,
            dateModified: topic.latest?.at ?? null,
            lists: parts.map((p) => ({ name: translate(locale, p.name), entries: p.entries(p.data) })),
            locale,
          }),
          crumbs,
        ],
  });
}

export default function TopicRoute() {
  const { t, locale } = useI18n();
  const { monthDayTime } = useFormat();
  const { data } = useLoaderData<typeof loader>();
  const { topic, items, page, pageCount, pageSize } = data;
  const parts = partsOf(data);
  const href = (p: number) => (p <= 1 ? `/topics/${topic.slug}` : `/topics/${topic.slug}/page/${p}`);
  const first = (page - 1) * pageSize + 1;
  const last = first + items.length - 1;
  const num = (n: number) => n.toLocaleString(locale === "en" ? "en" : "zh-CN");
  return (
    <div className="pb-6">
      <PhoneBar back={inNav("/topics") ? { to: "/topics", label: "全部主题" } : { to: "/", label: "精选" }} title={topic.name} />
      <Link to={inNav("/topics") ? "/topics" : "/"} className="hidden items-center gap-1.5 py-2 text-[13px] text-ink-3 transition-colors hover:text-accent lg:inline-flex">
        <IconArrowLeft size={14} /> {inNav("/topics") ? t("返回全部主题") : t("返回精选")}
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 pb-5 pt-3 lg:pt-1">
        <div className="min-w-0 max-w-[760px]">
          <p className="text-[12px] font-semibold tracking-[0.08em] text-accent">{topic.groupName}</p>
          <h1 data-page-title="" className="mt-1.5 flex items-center gap-3 text-[24px] font-bold leading-[1.3] tracking-[-0.01em] text-ink lg:text-[26px]">
            {topic.brand && <BrandMark brand={topic.brand} size={34} />}
            <span>
              {topic.name}{" "}
              <span className="whitespace-nowrap font-semibold text-ink-4">{t("最新动态")}</span>
            </span>
          </h1>
          <p className="mt-1.5 text-pretty text-[13.5px] leading-relaxed text-ink-3">{topic.definition}</p>
          <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-4">
            <span>
              <span className="num font-semibold text-ink-2">{num(topic.total)}</span>{` ${t(REPORTS.metricUnits.selectedCount)}`}
            </span>
            <span>
              {t("近 30 天 ")}<span className="num font-semibold text-ink-2">{num(topic.recent)}</span>{t(" 条")}
            </span>
            <span>
              {t("共收录 ")}<span className="num font-semibold text-ink-2">{num(topic.poolTotal)}</span>{t(" 条")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-ink-4">
          {topic.latest && (
            <span>
              <time dateTime={topic.latest.at} className="num">{monthDayTime(topic.latest.at)}</time>{t(" 更新")}
            </span>
          )}
        </div>
      </header>

      {parts.map((p) => (
        <div key={`${p.key}:${topic.slug}`} className="mb-8">
          <p.Block data={p.data} topic={topic} />
        </div>
      ))}

      <h2 className="sr-only">{page === 1 ? t("{name}的精选", { name: topic.name }) : t("精选归档 · 第 {page} 页", { page })}</h2>
      {items.length === 0 ? (
        <div className="lg:card">
          <EmptyState title={t("这个主题暂时还没有精选内容")} />
        </div>
      ) : (
        <DayList items={items} headerAside={<span className="num whitespace-nowrap">{t("第 {first}–{last} 条", { first, last })}<span className="hidden sm:inline">{t(" · 共 {n} 条", { n: num(topic.total) })}</span></span>} />
      )}
      <Pagination page={page} pageCount={pageCount} href={href} />
    </div>
  );
}
