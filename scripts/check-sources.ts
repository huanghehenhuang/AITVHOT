// Check the source pack without seeding a database. --live explicitly reads the free public lists;
// it never runs article extraction, model processing, X/WeChat APIs or a worker.
import { readFileSync } from "node:fs";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { fetchRss } from "@aihot/backend/sources/rss";
import { fetchWebList, allowed } from "@aihot/backend/sources/web-list";
import { fetchJsonList } from "@aihot/backend/sources/json-list";
import { noiseFiltered } from "@aihot/backend/sources/collect";
import type { Candidate, SourceRow } from "@aihot/backend/sources/types";
import { closeDb } from "@aihot/backend/db";

const { sources } = JSON.parse(readFileSync(new URL("../industry/sources.json", import.meta.url), "utf8")) as { sources: SourceRow[] };
const ids = new Set<string>();
const urls = new Set<string>();
for (const source of sources) {
  assertSupportedConfig(source.kind, source.config);
  if (ids.has(source.id)) throw new Error(`Duplicate source ID: ${source.id}`);
  ids.add(source.id);
  if (!["rss", "web_list", "json_list"].includes(source.kind)) throw new Error(`Source requires a paid provider or push: ${source.id}`);
  const url = new URL(source.config.feedUrl ?? source.config.url);
  if (url.protocol !== "https:" || url.hostname === "r.jina.ai" || url.username || url.password) throw new Error(`Source is not a direct public HTTPS list: ${source.id}`);
  url.searchParams.sort();
  const key = url.toString().replace(/\/$/, "");
  if (urls.has(key)) throw new Error(`Duplicate source URL: ${source.id}`);
  urls.add(key);
}

if (!process.argv.includes("--live")) {
  console.log(`${sources.length} source configs checked. Use --live to verify the public lists (network requests).`);
} else {
  const checkedAt = new Date().toISOString();
  const now = Date.now();
  const cutoff = now - 30 * 86400_000;
  const rows: Record<string, unknown>[] = [];
  let next = 0;
  // Limit simultaneous reads instead of sending the entire catalog to one provider at once.
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < sources.length) {
      const source = sources[next++]!;
      try {
        let candidates: Candidate[];
        if (source.kind === "rss") candidates = (await fetchRss(source, { force: true })).candidates;
        else if (source.kind === "web_list") candidates = await fetchWebList(source);
        else candidates = await fetchJsonList(source);
        const scoped = candidates.filter((c) => allowed(c.url, source) && !noiseFiltered(c, source));
        const dates = scoped.flatMap((c) => c.publishedAt && Number.isFinite(c.publishedAt.getTime()) ? [c.publishedAt] : []);
        rows.push({ id: source.id, items: candidates.length, scoped: scoped.length, dated: dates.length,
          recent30Days: dates.filter((d) => d.getTime() >= cutoff && d.getTime() <= now).length,
          latest: dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString() : null,
          sample: scoped.slice(0, 2).map((c) => ({ title: c.title, url: c.url, publishedAt: c.publishedAt?.toISOString() ?? null })),
          ...(candidates.length === 0 ? { error: "No items parsed; check the endpoint and selectors" }
            : scoped.length === 0 ? { note: "Current list has no topic-matched items" } : {}),
        });
      } catch (e) {
        rows.push({ id: source.id, error: String(e) });
      }
    }
  }));
  rows.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  console.log(JSON.stringify({ checkedAt, sources: rows }, null, 2));
  if (rows.some((r) => r.error)) process.exitCode = 1;
}
await closeDb();
