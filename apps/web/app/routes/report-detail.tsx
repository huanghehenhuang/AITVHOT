import { data, useLoaderData } from "react-router";
import type { Route } from "./+types/report-detail";
import type { ReportDetail, ReportNavigationResponse, ReportKind } from "@aihot/contracts/site";
import { SITE, subjectAfter, withSubject } from "@aihot/site";
import { apiGet, cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { pageMeta, reportLd, reportTitle, titled } from "../lib/seo";
import { beijingDate } from "@aihot/contracts/time";
import { localeFromMatches, translate, useI18n } from "../i18n";
import { ReportLayout } from "../features/report/ReportLayout";
import { ReportPaper, reportOutline } from "../features/report/ReportPaper";
import { KIND_LABEL, feedLink, kindFromPath, quietText } from "../features/report/format";
import type { Screen } from "../components/shell/screens";

export const handle: Screen = { tab: "daily", name: "日报" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

const PATTERN: Record<ReportKind, RegExp> = {
  daily: /^\d{4}-\d{2}-\d{2}$/,
  weekly: /^\d{4}-W\d{2}$/,
  monthly: /^\d{4}-\d{2}$/,
};

export async function loader({ request, params }: Route.LoaderArgs) {
  const kind = kindFromPath(new URL(request.url).pathname);
  const key = params.key ?? "";
  if (!PATTERN[kind].test(key)) throw data({ message: "not_found" }, { status: 404 });
  const [report, { items: index }] = await Promise.all([
    loadOr404<ReportDetail>(`/api/site/reports/${kind}/${key}`, { signal: request.signal }),
    apiGet<ReportNavigationResponse>(`/api/site/reports/${kind}/navigation/${key}`, { signal: request.signal }),
  ]);
  return cachedPage(3600, { report, index, today: beijingDate(Date.now()) });
}

export function meta({ loaderData, matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  if (!loaderData) return [{ title: titled(translate(locale, "报告不存在")) }, { name: "robots", content: "noindex" }];
  const r = loaderData.report;
  const fallback = translate(locale, `${SITE.name} {key} ${subjectAfter("的", KIND_LABEL[r.kind])}。`, { key: r.key });
  const description = r.lead?.leadParagraph ? quietText(r.lead.leadParagraph, locale) : (r.overview?.slice(0, 150) ?? fallback);
  const path = `/${r.kind}/${r.key}`;
  const zhTitle = reportTitle(r);
  const name = withSubject(KIND_LABEL[r.kind]);
  const title = locale === "zh" || !zhTitle.startsWith(name) ? zhTitle : `${translate(locale, name)}${zhTitle.slice(name.length)}`;
  return [...pageMeta({
    title,
    description,
    path,
    image: `/og/reports/${r.kind}/${r.key}.png`,
    type: "article",
    jsonLd: reportLd(r, path, description, locale),
    locale,
  }), feedLink(r.kind, locale)];
}

export default function ReportDetailPage() {
  const { report, index, today } = useLoaderData<typeof loader>();
  const { locale } = useI18n();
  return (
    <ReportLayout kind={report.kind} index={index} current={report.key} today={today} outline={reportOutline(report, locale)}>
      <ReportPaper report={report} index={index} />
    </ReportLayout>
  );
}
