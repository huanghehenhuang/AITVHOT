import { POLICY, SITE } from "@aihot/site";
import copyZh from "@aihot/site/pages/privacy.md?raw";
import copyEn from "@aihot/site/pages/privacy.en.md?raw";
import { edgeTtl } from "../lib/api.server";
import { pageMeta } from "../lib/seo";
import { prepareCopy } from "../lib/site-copy";
import { CopyPage, LegalFooterLinks } from "../features/copy/CopyPage";
import type { Screen } from "../components/shell/screens";
import { localeFromMatches, translate, useI18n } from "../i18n";
import type { Route } from "./+types/privacy";

export const handle: Screen = { tab: "me" };

const PRIVACY = { zh: prepareCopy(copyZh), en: prepareCopy(copyEn) };

export function headers() {
  return edgeTtl(300);
}

export function meta({ matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  return pageMeta({ title: translate(locale, "隐私说明"), description: translate(locale, POLICY.privacy.description), path: "/privacy", image: "/og/pages/privacy.png", locale });
}

export default function PrivacyPage() {
  const { locale, t } = useI18n();
  const page = PRIVACY[locale];
  return (
    <CopyPage
      doc={page.doc}
      rendered={page.rendered}
      eyebrow={SITE.name}
      footer={<LegalFooterLinks links={[{ to: "/terms", label: t(POLICY.terms.name) }, { to: "/feedback", label: t("反馈页") }]} note={`${t("隐私说明")} ${page.doc.meta["版本"] ?? page.doc.meta.Version ?? ""} · ${page.doc.meta["生效日期"] ?? page.doc.meta.Effective ?? ""}`} />}
    />
  );
}
