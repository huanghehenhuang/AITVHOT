import { readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "@aihot/backend/config";
import type { KnowledgeCatalog, KnowledgeEdit } from "../types.ts";
import { suggestedTags } from "../tags.ts";
import { needsIntroduction } from "./introduction.ts";

export const catalogPath = path.join(config.dataDir, "knowledge", "catalog.json");
export async function readCatalog(): Promise<KnowledgeCatalog> {
  const seed: KnowledgeCatalog = JSON.parse(await readFile(new URL("../catalog.json", import.meta.url), "utf8"));
  try {
    const collected: KnowledgeCatalog = JSON.parse(await readFile(catalogPath, "utf8"));
    const entries = new Map(seed.entries.map(entry => [entry.id, entry]));
    for (const entry of collected.entries) {
      const original = entries.get(entry.id);
      entries.set(entry.id, original ? {
        ...original, status: entry.status, checkedAt: entry.checkedAt, addedAt: original.addedAt ?? entry.addedAt,
        summary: needsIntroduction(original.summary) && !needsIntroduction(entry.summary) ? entry.summary : original.summary,
        stars: entry.stars, updatedAt: entry.updatedAt, license: entry.license ?? original.license,
      } : entry);
    }
    return { checkedAt: collected.checkedAt, entries: [...entries.values()], runs: collected.runs };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return seed;
  }
}
export async function loadKnowledge(query: URLSearchParams, edits: ReadonlyMap<string, KnowledgeEdit> = new Map()) {
  const [catalog, introductionJson] = await Promise.all([readCatalog(), readFile(new URL("../introductions.json", import.meta.url), "utf8")]);
  const introductions = new Map(Object.entries(JSON.parse(introductionJson) as Record<string, string>));
  const resources = catalog.entries.map(entry => {
    const edit = edits.get(entry.id);
    const summary = edit?.summary ?? introductions.get(entry.id) ?? (needsIntroduction(entry.summary) ? "" : entry.summary);
    const resource = { ...entry, summary };
    return { ...resource, tags: edit?.tags ?? suggestedTags(resource) };
  });
  const tag = (query.get("tag") ?? "").slice(0, 30);
  const kind = query.get("kind") ?? "";
  const stage = query.get("stage") ?? "";
  const source = query.get("source") ?? "";
  const license = query.get("license") ?? "";
  const status = query.get("status") ?? "";
  const sort = query.get("sort") ?? "added";
  const recent = ["1", "7", "30"].includes(query.get("recent") ?? "") ? query.get("recent")! : "";
  const since = recent ? Date.now() - Number(recent) * 86400000 : 0;
  const q = (query.get("q") ?? "").trim().slice(0, 200);
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = resources.filter(entry =>
    (!kind || entry.kind === kind) && (!stage || entry.stage === stage)
    && (!tag || entry.tags.includes(tag))
    && (!source || (entry.repo ?? new URL(entry.url).hostname) === source)
    && (!license || (entry.license ?? "unknown") === license)
    && (!status || entry.status === status)
    && (!recent || (Date.parse(entry.addedAt ?? "") || 0) >= since)
    && terms.every(term => [entry.title, entry.summary, entry.repo, entry.stage, entry.prerequisites, entry.license, ...entry.tags].join(" ").toLowerCase().includes(term)));
  if (sort === "title") matches.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  if (sort === "stars") matches.sort((a, b) => (b.stars ?? -1) - (a.stars ?? -1));
  if (sort === "updated") matches.sort((a, b) => (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0));
  if (sort === "added") matches.sort((a, b) => (Date.parse(b.addedAt ?? "") || 0) - (Date.parse(a.addedAt ?? "") || 0));
  const counts = { tutorial: 0, skill: 0, project: 0, prompt: 0, workflow: 0 };
  for (const entry of catalog.entries) counts[entry.kind]++;
  const pages = Math.max(1, Math.ceil(matches.length / 36));
  const page = Math.min(pages, Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1));
  const entries = matches.slice((page - 1) * 36, page * 36);
  return { entries, counts, total: catalog.entries.length, matchedTotal: matches.length, page, pages, checkedAt: catalog.checkedAt, runs: catalog.runs ?? [],
    stages: [...new Set(catalog.entries.map(entry => entry.stage))],
    sources: [...new Set(catalog.entries.map(entry => entry.repo ?? new URL(entry.url).hostname))].sort(),
    licenses: [...new Set(catalog.entries.map(entry => entry.license ?? "unknown"))].sort(),
    tags: [...new Set(resources.flatMap(entry => entry.tags))].sort((a, b) => a.localeCompare(b, "zh-CN")),
    filters: { q, kind, stage, source, license, status, sort, recent, tag } };
}
