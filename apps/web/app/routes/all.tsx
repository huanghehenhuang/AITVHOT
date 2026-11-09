import { useEffect } from "react";
import { Form, Link, redirect, useLoaderData, useNavigation, useSearchParams } from "react-router";
import type { Route } from "./+types/all";
import { readPoolFacets, type PoolFacets } from "@aihot/contracts/pool-filters";
import type { PoolResponse } from "@aihot/contracts/site";
import { SITE, subjectAfter } from "@aihot/site";
import { beijingTime } from "@aihot/contracts/time";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { filterParams, hasFeedFilters, itemListLd, listPath, pageMeta, readFilters } from "../lib/seo";
import { ActiveFilters, CategoryTabs, FeedBar, FeedFilterButton, FirstPartyFilter, SearchField } from "../features/feed/Filters";
import { PillTabs } from "../components/ui/Tabs";
import { DayList, Pagination } from "../features/feed/DayList";
import { EmptyState } from "../components/ui/Page";
import { IconSearch } from "../components/icons";
import { PhoneBar } from "../components/shell/PhoneBar";
import { isPhone, type Screen } from "../components/shell/screens";
import { openSearch } from "../features/search/SearchOverlay";
import { addRecentSearch } from "../lib/local-state";
import { countLabel, localeFromMatches, tagLabel, translate, useI18n } from "../i18n";

export const handle: Screen = { tab: "featured", name: "全部" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

const ALL_TITLE = subjectAfter("全部", "动态");

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 200) || null;
  const tab = url.searchParams.get("tab") === "relevance" ? "relevance" : null;
  // Older deep-paging parameters (deep, anchorAt) still open a normal page.
  const page = Math.min(Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1), 50);
  const data = await loadOr404<PoolResponse>(
    listPath("/api/site/pool", { ...filterParams(readFilters(url.searchParams)), ...readPoolFacets(name => url.searchParams.get(name)), q, tab, page: page > 1 ? page : null }),
    // The busy page keeps the search, so it can be tried again as it was.
    { signal: request.signal, busyRedirect: `/all/search-busy${url.search}` },
  );
  // Past the last page of what there is: the last page, with the same search and filters.
  if (data.total > 0 && data.page > data.pageCount) throw redirect(pageHref(url.searchParams, data.pageCount));
  return cachedPage(60, { data });
}

export function meta({ matches, loaderData }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  const f = loaderData?.data.filters;
  const q = f?.q;
  const page = loaderData?.data.page ?? 1;
  const path = listPath("/all", { ...(f && filterParams(f)), from: f?.from, to: f?.to, source: f?.source, q, tab: q && f?.tab === "relevance" ? "relevance" : null, page: page > 1 ? page : null });
  const title = `${q ? translate(locale, "搜索：{q}", { q }) : translate(locale, ALL_TITLE)}${page > 1 ? translate(locale, " · 第 {n} 页", { n: page }) : ""}`;
  const noindex = !!(q || f?.from || f?.to || f?.source) || hasFeedFilters(f);
  return pageMeta({ translationReady: loaderData && "translationReady" in loaderData ? loaderData.translationReady : undefined,
    title,
    description: translate(locale, `${SITE.name} 收录的${subjectAfter("全部", "相关动态")}，可按频道、类别与标签筛选，支持中英文搜索。`),
    path,
    noindex,
    locale,
    jsonLd: noindex ? undefined : itemListLd(path, title, loaderData?.data.items.map((i) => i.title) ?? [], locale),
  });
}

function pageHref(params: URLSearchParams, page: number) {
  const sp = new URLSearchParams(params);
  sp.delete("deep");
  sp.delete("anchorAt");
  sp.delete("search");
  if (page <= 1) sp.delete("page");
  else sp.set("page", String(page));
  const s = sp.toString();
  return s ? `/all?${s}` : "/all";
}

function DateSourceFilters({ filters, keep }: { filters: PoolFacets; keep: Record<string, string | null> }) {
  const { t } = useI18n();
  const { from, to, source } = filters;
  const active = [from, to, source].filter(Boolean).length;
  const field = "min-h-11 w-full min-w-0 rounded-control border border-line-strong bg-surface px-3 text-sm text-ink";
  return (
    <details className="mb-4 rounded-control border border-line px-3" open={active > 0 || undefined}>
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink">
        {t("日期与来源")}{active > 0 && ` · ${active}`}
      </summary>
      <Form method="get" className="flex flex-wrap items-end gap-3 pb-3" key={JSON.stringify([from, to, source])}>
        {Object.entries(keep).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
        <label className="grid min-w-0 flex-[1_1_9rem] gap-1 text-xs text-ink-3">
          {t("起始日期")}
          <input className={field} type="date" name="from" defaultValue={from ?? ""} />
        </label>
        <label className="grid min-w-0 flex-[1_1_9rem] gap-1 text-xs text-ink-3">
          {t("结束日期")}
          <input className={field} type="date" name="to" defaultValue={to ?? ""} />
        </label>
        <label className="grid min-w-0 flex-[2_1_12rem] gap-1 text-xs text-ink-3">
          {t("报道来源")}
          <input className={field} type="search" name="source" defaultValue={source ?? ""} maxLength={120} placeholder={t("输入部分来源名称")} />
        </label>
        <button className="min-h-11 rounded-control bg-ink px-4 text-sm text-accent-contrast" type="submit">{t("筛选")}</button>
        {active > 0 && <Link className="inline-flex min-h-11 items-center text-sm underline" to={listPath("/all", keep)}>{t("清除日期与来源")}</Link>}
        <p className="w-full text-xs text-ink-3">{t("日期按北京时间的资讯列表日期计算，包含起止当天。")}</p>
      </Form>
    </details>
  );
}

export default function AllPage() {
  const { data } = useLoaderData<typeof loader>();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const navigation = useNavigation();
  const f = data.filters;
  const busy = navigation.state === "loading" && navigation.location?.pathname === "/all";
  const facetKeep = { ...filterParams(f), q: f.q, tab: f.tab === "relevance" ? f.tab : null };
  const searchKeep = { ...filterParams(f), from: f.from ?? null, to: f.to ?? null, source: f.source ?? null };
  const searchTabHref = (tab: "time" | "relevance") => {
    const sp = new URLSearchParams(params);
    sp.delete("page");
    if (tab === "relevance") sp.set("tab", "relevance");
    else sp.delete("tab");
    return `/all?${sp}`;
  };
  const title = f.q ? t("搜索“{q}”", { q: f.q }) : f.tag ? `#${tagLabel(f.tag, locale)}` : null;
  const updated = beijingTime(data.freshness);
  // Searches are remembered in this browser for the phone search (listed in the privacy notice).
  useEffect(() => {
    if (f.q) addRecentSearch(f.q);
  }, [f.q]);
  // Older phone links (/all?search=1) opened the search field; they open the search now.
  useEffect(() => {
    if (params.get("search") === "1" && isPhone()) openSearch(f.q ?? "");
  }, []);

  return (
    <div className="pb-6">
      {/* Phones: the feed bar, or for a search the query (tap to change it) and back to 全部. */}
      {f.q ? (
        <PhoneBar
          back={{ to: "/all", label: "全部" }}
          actions={<FeedFilterButton base="/all" category={f.category} channel={f.channel} />}
          center={
            <button type="button" onClick={(event) => openSearch(f.q ?? "", event.currentTarget)} className="flex h-11 min-w-0 max-w-full items-center gap-2 rounded-full bg-bg-sunk px-3.5 text-[15px] text-ink ring-1 ring-inset ring-line-soft dark:bg-bg-muted/60">
              <IconSearch size={16} className="shrink-0 text-ink-4" />
              <span className="truncate">{f.q}</span>
            </button>
          }
        />
      ) : (
        <FeedBar base="/all" category={f.category} channel={f.channel} />
      )}
      <ActiveFilters base="/all" category={f.category} channel={f.channel} tag={f.tag} />

      {/* Desktop, as on 精选: the title, then one filter row with the search field aligned on the right. */}
      <div className="hidden lg:block">
        <h1 className="text-[24px] font-semibold leading-[1.3] text-ink">{title ?? t(ALL_TITLE)}</h1>
        <div className="mb-5 mt-4 flex items-center justify-between gap-4">
          <CategoryTabs base="/all" category={f.category} layoutId="all-cat-desk" className="min-w-0" />
          <SearchField defaultValue={f.q ?? ""} keep={searchKeep} />
        </div>
        <FirstPartyFilter base="/all" channel={f.channel} />
      </div>

      <DateSourceFilters filters={f} keep={facetKeep} />

      {f.q && (
        <div className="mb-3 mt-1 flex flex-wrap items-center justify-between gap-2 lg:mt-0">
          <PillTabs
            size="xs"
            layoutId="all-search-sort"
            label={t("搜索排序")}
            active={f.tab}
            items={(["time", "relevance"] as const).map((tab) => ({ key: tab, label: tab === "time" ? t("最新（标题与摘要）") : t("全文相关"), to: searchTabHref(tab) }))}
          />
          <span className="text-[12px] text-ink-4">
            {t("找到")} <span className="num">{data.total >= 2000 ? "2000+" : data.total}</span> {countLabel(locale, data.total >= 2000 ? 2 : data.total, "条", "item", "items")} · {t("更新于")} <span className="num">{updated}</span>
          </span>
        </div>
      )}

      <div className={`transition-opacity duration-200 ${busy ? "opacity-50" : ""}`}>
        {data.items.length === 0 ? (
          <div className="mt-2 lg:card">
            <EmptyState
              title={t("没有找到相关内容")}
              action={
                f.q && f.tab === "time" ? (
                  <Link to={searchTabHref("relevance")} className="text-[13px] font-medium text-accent hover:underline">
                    {t("试试“全文相关”，连正文一起搜")}
                  </Link>
                ) : undefined
              }
            >
              {f.q ? t("换个说法，或者去掉筛选再试。") : t("这个筛选下暂时没有内容。")}
            </EmptyState>
          </div>
        ) : (
          <DayList items={data.items} groups={data.groups} filters={f} todayCount={f.q ? null : data.todayCount} />
        )}
      </div>
      <Pagination page={data.page} pageCount={data.pageCount} href={(p) => pageHref(params, p)} />
      {data.page >= 50 && <p className="mt-4 text-center text-[12px] text-ink-4">{t("最多提供 50 页，更早的内容请使用搜索或主题页。")}</p>}
    </div>
  );
}
