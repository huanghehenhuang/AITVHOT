import { Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { HotResponse, TimelineResponse } from "@aihot/contracts/site";
import { useEffect, useState } from "react";
import { beijingDate } from "@aihot/contracts/time";
import { HOT_REFRESH_MINUTES } from "@aihot/contracts/site";
import { FeedItem } from "../features/feed/FeedItem";
import { isRankingDelayed, RankingUpdate } from "../features/hot/RankingUpdate";
import { Delta } from "../features/hot/Delta";
import { KEYS, markRead, readRaw, writeRaw } from "../lib/local-state";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { filterParams, hasFeedFilters, itemListLd, listPath, pageMeta, readFilters, siteLd } from "../lib/seo";
import { inNav } from "../components/shell/nav";
import type { Screen } from "../components/shell/screens";
import { Timeline } from "../features/feed/Timeline";
import { ActiveFilters, HomeFilters } from "../features/feed/Filters";
import { categoryLabel, localeFromMatches, tagLabel, translate, useI18n } from "../i18n";
import { DesignAsset } from "../components/ui/DesignAsset";

export const handle: Screen = { tab: "featured", name: "精选" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();


export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  // Search lives on /all; keep the parameters so old links still land on results.
  if (q && q.trim()) throw redirect(`/all${url.search}`);
  const filters = readFilters(url.searchParams);
  const upstream = new Headers();
  const [data, ranking] = await Promise.all([
    loadOr404<TimelineResponse>(listPath("/api/site/timeline", filterParams(filters)), { responseHeaders: upstream, signal: request.signal }),
    inNav("/hot") && !hasFeedFilters(filters)
      ? loadOr404<HotResponse>("/api/site/hot", { signal: request.signal }).catch(() => null)
      : null,
  ]);
  const now = Date.now();
  // The timeline already selects and deduplicates reports. Use its newest entry as the lead.
  const lead = hasFeedFilters(filters) ? null : data.cards[0] ?? null;
  const hot = ranking && Array.isArray(ranking.entries) ? {
    computedAt: ranking.computedAt,
    delayed: isRankingDelayed(ranking.computedAt, now),
    entries: ranking.entries.slice(0, 5).map(({ rank, story, trend, trendPct }) => ({ rank, story, trend, trendPct })),
  } : null;
  return cachedPage(60, { data, filters, lead, hot, today: beijingDate(now) }, upstream);
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  const path = listPath("/", loaderData ? filterParams(loaderData.filters) : {});
  const titles = loaderData?.data.cards.map((c) => c.item.title) ?? [];
  return pageMeta({ translationReady: loaderData?.translationReady, path, locale, noindex: hasFeedFilters(loaderData?.filters), jsonLd: path === "/" ? [...siteLd(locale), itemListLd("/", translate(locale, "精选"), titles, locale)] : undefined });
}

export default function Home() {
  const { data, filters, lead, hot, today } = useLoaderData<typeof loader>();
  const { t, locale } = useI18n();
  const [detailed, setDetailed] = useState(false);
  useEffect(() => setDetailed(readRaw(KEYS.feedDensity, "session") === "detailed"), []);
  function toggleDensity() {
    writeRaw(KEYS.feedDensity, detailed ? null : "detailed", "session");
    setDetailed(!detailed);
  }
  const filtered = hasFeedFilters(filters);
  const title = filters.tag ? `#${tagLabel(filters.tag, locale)}` : filters.category ? categoryLabel(filters.category, locale) : t("最新精选");
  const Heading = lead ? "h2" : "h1";
  return (
    <div className="editorial-home pb-6">
      {lead && (
        <section className="home-focus" aria-labelledby="home-focus-heading">
          <h1 id="home-focus-heading">{t(beijingDate(lead.anchorAt) === today ? "今日焦点" : "近期焦点")}</h1>
          <FeedItem item={lead.item} at={lead.anchorAt} onOpen={markRead} editorial lead />
        </section>
      )}
      <div className="home-categories"><HomeFilters category={filters.category} channel={filters.channel} /></div>
      <aside className="home-sidebar" aria-label={t("阅读入口")}>
        {inNav("/hot") && !filtered && (
          <section className="home-ranking" aria-labelledby="home-ranking-heading">
            <div className="home-panel-heading"><h2 id="home-ranking-heading">{t("行业热榜")}</h2><Link to="/hot">{t("完整榜单")} →</Link></div>
            <p className="home-rank-status">
              {hot && <RankingUpdate computedAt={hot.computedAt} delayed={hot.delayed} />}
            </p>
            {hot?.entries.length ? (
              <ol>{hot.entries.map(({ rank, story, trend, trendPct }) => (
                <li key={story.publicId}>
                  <span className="mono">{String(rank).padStart(2, "0")}</span>
                  <Link to={`/story/${story.publicId}`}>{story.title}</Link>
                  {trend !== "unknown" && <Delta trend={trend} pct={trendPct} />}
                </li>
              ))}</ol>
            ) : <p className="home-rank-status">{t(hot ? "暂时没有热点" : "热榜暂不可用")}</p>}
            <p className="home-rank-status">{t("每 {n} 分钟计算", { n: HOT_REFRESH_MINUTES })} · <Link to="/hot#hot-method">{t("怎么算")}</Link></p>
          </section>
        )}
        <div className="home-resources">
          {inNav("/knowledge") && <section><h2>{t("创作资源")}</h2><Link to="/knowledge?recent=7&sort=added">{t("最近 7 天新增")} →</Link><Link to="/knowledge?kind=workflow">{t("图像与短剧工作流")} →</Link></section>}
          {inNav("/daily") && <Link to="/daily">{t("阅读今日日报")} →</Link>}
          {inNav("/topics") && <Link to="/topics">{t("查看全部主题")} →</Link>}
        </div>
      </aside>
      <section className="home-feed min-w-0" aria-labelledby="home-feed-heading">
        <ActiveFilters base="/" category={filters.category} channel={filters.channel} tag={filters.tag} />
        <div className="editorial-section-heading">
          <Heading id="home-feed-heading">{title}</Heading>
          <button type="button" aria-pressed={detailed} onClick={toggleDensity}>{t("详细模式")}</button>
        </div>
        <Timeline initial={data} filters={data.filters} editorial detailed={detailed} excludeKey={lead?.key} />
        <Link className="editorial-all-link" to="/all">{t("浏览全部动态")}<DesignAsset name="arrow" /></Link>
      </section>
    </div>
  );
}
