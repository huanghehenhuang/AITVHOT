import { Link } from "react-router";
import { SITE } from "@aihot/site";
import { Wordmark } from "@aihot/site/brand/Logo.tsx";
import { useI18n } from "../../i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return <footer className="editorial-footer"><div className="editorial-footer-brand"><Link to="/" aria-label={`${SITE.name} ${t("首页")}`}><Wordmark size={36} title="AITVHOT.TOP" /></Link><p>{t("关注 AI 影视与短剧的实际进展")}</p></div><nav aria-label={t("更多")}><Link to="/about">{t("关于")}</Link><a href="/feed.xml">RSS</a><Link to="/feedback">{t("反馈")}</Link><Link to="/more">{t("我的")}</Link></nav></footer>;
}
