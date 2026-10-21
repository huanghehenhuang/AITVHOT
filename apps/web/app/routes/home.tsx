import { Link, redirect, useLoaderData } from "react-router";
import type { Route } from "./+types/home";
import type { TimelineResponse } from "@aihot/contracts/site";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { filterParams, hasFeedFilters, itemListLd, listPath, pageMeta, readFilters, siteLd } from "../lib/seo";
import { inNav } from "../components/shell/nav";
import type { Screen } from "../components/shell/screens";
import { Timeline } from "../features/feed/Timeline";
import { HotTopics } from "../features/feed/HotTopics";
import { ActiveFilters, CategoryTabs, FeedBar, SearchField } from "../features/feed/Filters";
import { localeFromMatches, tagLabel, translate, useI18n } from "../i18n";

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
  const data = await loadOr404<TimelineResponse>(listPath("/api/site/timeline", filterParams(filters)), { responseHeaders: upstream, signal: request.signal });
  return cachedPage(60, { data, filters }, upstream);
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  const path = listPath("/", loaderData ? filterParams(loaderData.filters) : {});
  const titles = loaderData?.data.cards.map((c) => c.item.title) ?? [];
  return pageMeta({ path, locale, noindex: hasFeedFilters(loaderData?.filters), jsonLd: path === "/" ? [...siteLd(locale), itemListLd("/", translate(locale, "精选"), titles)] : undefined });
}

export default function Home() {
  const { data, filters } = useLoaderData<typeof loader>();
  const { t, locale } = useI18n();
  const title = filters.tag ? `#${tagLabel(filters.tag, locale)}` : t("精选");
  const Heading = hasFeedFilters(filters) ? "h1" : "h2";
  return (
    <div className="cinema-home pb-6">
      <FeedBar base="/" category={filters.category} channel={filters.channel} />
      {!hasFeedFilters(filters) && (
        <header className="editorial-masthead" aria-labelledby="editorial-heading">
          <div>
            <p className="editorial-kicker">{t("AITVHot / 行业观察")}</p>
            <h1 id="editorial-heading">{t("AI 影视与短剧")}</h1>
            <p className="editorial-description">{t("模型、工具、作品与行业动态，每日精选。")}</p>
          </div>
          <nav className="editorial-links" aria-label={t("阅读入口")}>
            <Link to="/daily">{t("今日日报")}</Link>
            {inNav("/topics") && <Link to="/topics" className="cinema-discover">{t("模型与工具")}</Link>}
          </nav>
        </header>
      )}
      {/* Phones: the bar (精选 | 全部, filter, search), the filter in use, today's hot topics, the feed. */}
      <ActiveFilters base="/" category={filters.category} channel={filters.channel} tag={filters.tag} />
      <div className="hidden lg:block">
        <Heading className="text-[24px] font-semibold leading-[1.3] text-ink">{title}</Heading>
        <div className="mb-5 mt-4 flex items-center justify-between gap-4">
          <CategoryTabs base="/" category={filters.category} channel={filters.channel} layoutId="home-cat-desk" className="min-w-0" />
          <SearchField keep={{ category: filters.category }} />
        </div>
      </div>

      {data.hot && inNav("/hot") && <HotTopics entries={data.hot} />}

      <Timeline initial={data} filters={data.filters} />
    </div>
  );
}
