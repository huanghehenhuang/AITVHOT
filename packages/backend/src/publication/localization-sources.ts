// Offline inventory from the same readable publications as the website. No original full text is sent
// for translation, and withdrawn/future reports cannot be reintroduced by translation memory.
import { sql } from "../db.ts";
import { listedCondition } from "./scope.ts";
import { loadHot, loadStoryDetail, resolveStory } from "./stories.ts";
import { listReports, loadReport } from "./reports.ts";
import { listTopicSummaries } from "./topics.ts";
import { loadDiscoveryEntries } from "./sitemap.ts";
import { loadTimeline } from "./timeline.ts";

export async function* localizationSources(): AsyncGenerator<unknown> {
  yield await loadTimeline({ channel: "all", category: null, tag: null, cursor: null, limit: 40 });
  const indexes = await Promise.all((["daily", "weekly", "monthly"] as const).map(async (kind) => ({ kind, items: await listReports(kind, 100_000) })));
  for (const index of indexes) {
    yield index;
    if (index.items[0]) yield await loadReport(index.kind, index.items[0].key);
  }
  const hot = await loadHot();
  yield hot;
  for (const entry of hot.entries) {
    const found = await resolveStory(entry.story.publicId);
    if (found.kind === "found") yield await loadStoryDetail(found.storyId);
  }
  yield await listTopicSummaries();
  for (const index of indexes) for (const item of index.items.slice(1)) yield await loadReport(index.kind, item.key);
  const articles = await sql<{ title: string; summary: string | null; reason: string | null }[]>`
    SELECT p.title, p.summary, CASE WHEN p.selected THEN p.reason END AS reason
    FROM publications p WHERE ${listedCondition(new Date())} ORDER BY p.timeline_at DESC, p.article_id`;
  for (const article of articles) yield article;
  // Discovery applies current evidence/withdrawal rules before resolving each story.
  for (const entry of await loadDiscoveryEntries()) {
    if (!entry.loc.startsWith("/story/")) continue;
    const found = await resolveStory(entry.loc.slice("/story/".length));
    if (found.kind === "found") yield await loadStoryDetail(found.storyId);
  }
}
