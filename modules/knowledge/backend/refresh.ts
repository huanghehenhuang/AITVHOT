import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { readCatalog, catalogPath } from "./publication.ts";
import { discoverGuides, discoverKnowledge, verifyResources, type FileSource, type SearchSource, type IndexSource, type FeedSource } from "./discovery.ts";

/** Discover resources daily, then validate and atomically publish the shared catalog. */
export async function refreshKnowledge() {
  const catalog = await readCatalog();
  const existingIds = new Set(catalog.entries.map(entry => entry.id));
  const sources: FileSource[] = JSON.parse(await readFile(new URL("../discovery-sources.json", import.meta.url), "utf8"));
  const searches: SearchSource[] = JSON.parse(await readFile(new URL("../searches.json", import.meta.url), "utf8"));
  const indexes: IndexSource[] = JSON.parse(await readFile(new URL("../index-sources.json", import.meta.url), "utf8"));
  const discovered = await discoverKnowledge(catalog.entries, sources, searches, indexes);
  catalog.entries.push(...discovered.entries.filter(entry => !existingIds.has(entry.id)));
  const feeds: FeedSource[] = JSON.parse(await readFile(new URL("../feed-sources.json", import.meta.url), "utf8"));
  const guides = await discoverGuides(catalog.entries, feeds);
  catalog.entries.push(...guides.entries);

  const repositories = [...new Set(catalog.entries.map(entry => entry.repo).filter(Boolean))];
  // Leave room for source trees and search within GitHub's public API budget.
  const budget = Math.max(5, 55 - sources.length - Math.min(5, searches.length));
  const batches = Math.max(1, Math.ceil(repositories.length / budget));
  const start = (Math.floor(Date.now() / 86400000) % batches) * budget;
  for (const repository of repositories.slice(start, start + budget)) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repository}`, {
        headers: { "User-Agent": "AITVHotKnowledge" }, signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) continue;
      const metadata = await response.json() as { pushed_at: string; stargazers_count: number; license?: { spdx_id: string } };
      for (const entry of catalog.entries.filter(entry => entry.repo === repository)) {
        entry.updatedAt = metadata.pushed_at;
        entry.stars = metadata.stargazers_count;
        entry.license = metadata.license?.spdx_id === "NOASSERTION" ? undefined : metadata.license?.spdx_id;
      }
    } catch { /* Retain collected metadata when a repository is unavailable. */ }
  }
  catalog.entries = await verifyResources(catalog.entries, existingIds);
  catalog.checkedAt = new Date().toISOString();
  const result = {
    at: catalog.checkedAt, added: catalog.entries.filter(entry => !existingIds.has(entry.id)).length,
    total: catalog.entries.length, available: catalog.entries.filter(entry => entry.status === "ok").length,
    sources: discovered.successfulSources + guides.successfulSources, failedSources: discovered.failedSources + guides.failedSources,
  };
  catalog.runs = [result, ...(catalog.runs ?? [])].slice(0, 30);
  await mkdir(path.dirname(catalogPath), { recursive: true });
  const temporary = catalogPath + ".tmp";
  await writeFile(temporary, JSON.stringify(catalog, null, 2));
  await rename(temporary, catalogPath);
  return result;
}
