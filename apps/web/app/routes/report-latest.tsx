import { useLoaderData } from "react-router";
import type { Route } from "./+types/report-latest";
import type { ReportLatestPage } from "@aihot/contracts/site";
import { REPORTS, subjectAfter, withSubject } from "@aihot/site";
import { cachedPage, loadOr404 } from "../lib/api.server";
import { pageReuse } from "../lib/page-reuse";
import { pageMeta, reportLd } from "../lib/seo";
import { beijingDate } from "@aihot/contracts/time";
import { localeFromMatches, translate, useI18n } from "../i18n";
import { EmptyState } from "../components/ui/Page";
import { ReportLayout } from "../features/report/ReportLayout";
import { ReportPaper, reportOutline } from "../features/report/ReportPaper";
import { KIND_LABEL, feedLink, kindFromPath, quietText } from "../features/report/format";
import type { Screen } from "../components/shell/screens";

export const handle: Screen = { tab: "daily", name: "日报" };
export { pageHeaders as headers } from "../lib/api.server";
export const { clientLoader, shouldRevalidate } = pageReuse<typeof loader>();

export async function loader({ request }: Route.LoaderArgs) {
  const kind = kindFromPath(new URL(request.url).pathname);
  const { index, report } = await loadOr404<ReportLatestPage>(`/api/site/reports/${kind}/latest-page`, { signal: request.signal });
  return cachedPage(600, { kind, report, index, today: beijingDate(Date.now()) });
}

export function meta({ loaderData, location, matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  const kind = loaderData?.kind ?? "daily";
  const body = translate(locale, REPORTS.descriptions[kind]);
  const description = `${body}${locale === "en" ? "." : "。"}`;
  const report = loaderData?.report;
  return [...pageMeta({
    title: translate(locale, withSubject(KIND_LABEL[kind])),
    description,
    path: location.pathname,
    image: `/og/pages/${kind}.png`,
    locale,
    // The latest issue, described at this page's own address (its canonical).
    jsonLd: report ? reportLd(report, location.pathname, report.lead?.leadParagraph ? quietText(report.lead.leadParagraph, locale) : description, locale) : undefined,
  }), feedLink(kind, locale)];
}

export default function ReportLatestPage() {
  const { kind, report, index, today } = useLoaderData<typeof loader>();
  const { locale, t } = useI18n();
  return (
    <ReportLayout kind={kind} index={index} current={report?.key ?? null} today={today} outline={report ? reportOutline(report, locale) : []}>
      {report ? <ReportPaper report={report} index={index} /> : <EmptyState title={t(subjectAfter("还没有发布", KIND_LABEL[kind]))}>{t("第一期发布后会出现在这里。")}</EmptyState>}
    </ReportLayout>
  );
}
