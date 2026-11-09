import { HOT_REFRESH_MINUTES } from "@aihot/contracts/site";
import { useFormat, useI18n } from "../../i18n";

export function isRankingDelayed(computedAt: string | null, now: number) {
  // Allow one missed scheduled run before flagging a delay.
  return !!computedAt && now - Date.parse(computedAt) >= 2 * HOT_REFRESH_MINUTES * 60_000;
}

export function RankingUpdate({ computedAt, delayed }: { computedAt: string | null; delayed: boolean }) {
  const { t } = useI18n();
  const { monthDayTime } = useFormat();
  if (!computedAt) return null;
  return <>
    <time className="num" dateTime={computedAt}>{monthDayTime(computedAt)}</time> {t("更新")}
    {delayed && <strong className="text-[var(--focus-ink)]"> · {t("更新延迟")}</strong>}
  </>;
}
