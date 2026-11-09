import { Link } from "react-router";
import type { SiteItemDetail } from "@aihot/contracts/site";
import { useI18n } from "@aihot/web/i18n";
import { knowledgeTopics } from "../topic-links";

export default function RelatedResources({ item }: { item: SiteItemDetail }) {
  const { t } = useI18n();
  const links = item.topics.flatMap(topic => {
    const match = knowledgeTopics.find(entry => entry.slug === topic.slug);
    return match ? [{ topic, tag: match.tag }] : [];
  }).slice(0, 3);
  if (links.length === 0) return null;

  return (
    <section className="mt-8 border-t border-line pt-4" aria-labelledby="related-knowledge-heading">
      <h2 id="related-knowledge-heading" className="text-base font-semibold text-ink">{t("相关创作资源")}</h2>
      <ul className="mt-1 divide-y divide-line-soft">
        {links.map(({ topic, tag }) => (
          <li key={topic.slug}>
            <Link className="flex min-h-11 items-center text-sm text-ink-2 hover:underline" to={`/knowledge?${new URLSearchParams({ tag, status: "ok" })}`}>
              {t("浏览「{topic}」相关资源", { topic: topic.name })} →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
