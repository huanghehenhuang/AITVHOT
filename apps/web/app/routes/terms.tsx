import { POLICY, SITE } from "@aihot/site";
import copyZh from "@aihot/site/pages/terms.md?raw";
import copyEn from "@aihot/site/pages/terms.en.md?raw";
import { edgeTtl } from "../lib/api.server";
import { pageMeta } from "../lib/seo";
import { prepareCopy } from "../lib/site-copy";
import { CopyPage, LegalFooterLinks } from "../features/copy/CopyPage";
import type { Screen } from "../components/shell/screens";
import { webModules } from "../site-modules";
import { localeFromMatches, translate, useI18n } from "../i18n";
import type { Route } from "./+types/terms";

export const handle: Screen = { tab: "me" };

const TERMS = { zh: prepareCopy(copyZh), en: prepareCopy(copyEn) };

export function headers() {
  return edgeTtl(300);
}

export function meta({ matches }: Route.MetaArgs) {
  const locale = localeFromMatches(matches);
  return pageMeta({ title: translate(locale, POLICY.terms.name), description: translate(locale, POLICY.terms.description), path: "/terms", image: "/og/pages/terms.png", locale });
}

export default function TermsPage() {
  const { locale, t } = useI18n();
  const page = TERMS[locale];
  return (
    <CopyPage
      doc={page.doc}
      rendered={page.rendered}
      eyebrow={SITE.name}
      footer={
        <LegalFooterLinks
          links={[
            { to: "/privacy", label: t("隐私说明") },
            { to: "/agent", label: t("Agent 接入页") },
            ...webModules().flatMap((m) => m.termsLinks ?? []),
          ]}
          note={`${t(POLICY.terms.name)} ${page.doc.meta["版本"] ?? page.doc.meta.Version ?? ""} · ${page.doc.meta["生效日期"] ?? page.doc.meta.Effective ?? ""}`}
        />
      }
    />
  );
}
