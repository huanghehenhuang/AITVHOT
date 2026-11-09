import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import type { KnowledgeEntry } from "../types.ts";
import { needsIntroduction, plainText, sourceIntroduction } from "./introduction.ts";

export interface FileSource { repo: string; pattern: string; stage: string; kind?: "skill" | "workflow" }
export interface SearchSource { query: string; stage: string; kind?: "prompt" }
export interface IndexSource { repo: string; stage: string; pattern: string; kind?: "prompt" }
export interface FeedSource { url: string; host: string; stage: string; pattern: string }
const headers = { "User-Agent": "AITVHotKnowledge" };

export function validResource(entry: KnowledgeEntry, body: string): boolean {
  if (body.length < 100 || /<title>[^<]*(?:404|access denied|just a moment)/i.test(body)) return false;
  if (entry.kind === "skill") return /^---\s*\r?\n[\s\S]*?^name:\s*\S/m.test(body) && /^description:\s*\S/m.test(body);
  if (entry.kind === "workflow") {
    try {
      const graph = JSON.parse(body);
      return Array.isArray(graph.nodes) && graph.nodes.some((node: { type?: string }) => typeof node.type === "string");
    } catch { return false; }
  }
  return true;
}

/** Read public source files only. Candidate resources are checked again before publication. */
export async function discoverKnowledge(known: KnowledgeEntry[], sources: FileSource[], searches: SearchSource[], indexes: IndexSource[], request: typeof fetch = fetch, now = new Date()) {
  const entries: KnowledgeEntry[] = [];
  const knownRepos = new Set(known.filter(entry => entry.kind === "project" || entry.kind === "prompt").map(entry => entry.repo));
  const knownLinks = new Set(known.map(entry => entry.checkUrl.toLowerCase().replace(/\/(?:main|master|head)\//g, "/HEAD/")));
  let successfulSources = 0, failedSources = 0;
  async function get(url: string) {
    const response = await request(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
    return response;
  }
  function add(entry: KnowledgeEntry) {
    const key = entry.checkUrl.toLowerCase().replace(/\/(?:main|master|head)\//g, "/HEAD/");
    if (knownLinks.has(key)) return;
    knownLinks.add(key);
    entries.push(entry);
  }
  for (const source of sources) {
    try {
      const listing = await (await get(`https://api.github.com/repos/${source.repo}/git/trees/HEAD?recursive=1`)).json() as { tree: Array<{ path: string; type: string }> };
      const pattern = new RegExp(source.pattern, "i"), kind = source.kind ?? "skill";
      let added = 0;
      for (const file of listing.tree) {
        if (file.type !== "blob" || !pattern.test(file.path) || !(kind === "skill" ? /(^|\/)SKILL\.md$/.test(file.path) : file.path.endsWith(".json"))) continue;
        const checkUrl = `https://raw.githubusercontent.com/${source.repo}/HEAD/${file.path}`;
        if (knownLinks.has(checkUrl.toLowerCase().replace(/\/head\//g, "/HEAD/"))) continue;
        if (added++ >= 10) break;
        add({
          id: `${kind}:${source.repo}:${file.path}`, kind,
          title: kind === "workflow" ? file.path.split("/").at(-1)! : file.path.split("/").at(-2) ?? source.repo,
          summary: "",
          stage: source.stage, prerequisites: kind === "workflow" ? "ComfyUI、对应模型与节点；API 节点需服务账号" : "支持 Agent Skill 的助手及原文要求的工具和服务",
          repo: source.repo, url: `https://github.com/${source.repo}/blob/HEAD/${file.path}`, checkUrl,
          checkedAt: "", status: "unavailable", addedAt: now.toISOString(),
        });
      }
      successfulSources++;
    } catch { failedSources++; }
  }
  async function repository(repo: string, stage: string, kind: "prompt" | "project", description?: string, branch = "HEAD", metadata?: { stargazers_count?: number; pushed_at?: string; license?: { spdx_id?: string } }) {
    if (knownRepos.has(repo)) return;
    const checkUrl = `https://raw.githubusercontent.com/${repo}/${branch}/README.md`;
    const body = await (await get(checkUrl)).text();
    if (body.length < 500 || !/(usage|install|example|getting.started|quick.start|workflow|prompt|使用|安装|示例|工作流|提示词)/i.test(body)) return;
    knownRepos.add(repo);
    add({ id: repo, kind, repo, title: repo.split("/").at(-1)!,
      summary: plainText(description).slice(0, 300),
      stage, prerequisites: "按原文配置模型、节点或服务；代码、模型和示例的授权需分别核对",
      url: `https://github.com/${repo}`, checkUrl, status: "unavailable", checkedAt: "", addedAt: now.toISOString(),
      stars: metadata?.stargazers_count, updatedAt: metadata?.pushed_at,
      license: metadata?.license?.spdx_id === "NOASSERTION" ? undefined : metadata?.license?.spdx_id,
    });
  }
  // Five rotating queries use the public search budget and cover every theme over four days.
  const day = Math.floor(now.getTime() / 86400000);
  for (let i = 0; i < Math.min(5, searches.length); i++) {
    const search = searches[(day * 5 + i) % searches.length]!;
    try {
      const cycle = Math.floor(day / Math.max(1, Math.ceil(searches.length / 5)));
      const query = new URLSearchParams({ q: `${search.query} fork:false archived:false stars:>=3`, sort: cycle % 2 ? "updated" : "stars", order: "desc", per_page: "30" });
      const result = await (await get(`https://api.github.com/search/repositories?${query}`)).json() as { items: Array<{ full_name: string; default_branch: string; description?: string; fork?: boolean; archived?: boolean; stargazers_count: number; pushed_at: string; license?: { spdx_id?: string } }> };
      let added = 0;
      for (const item of result.items) {
        if (item.fork || item.archived || knownRepos.has(item.full_name)) continue;
        if (added >= 8) break;
        const before = entries.length;
        try { await repository(item.full_name, search.stage, search.kind ?? "project", item.description, item.default_branch, item); } catch { continue; }
        if (entries.length > before) added++;
      }
      successfulSources++;
    } catch { failedSources++; }
  }
  for (const index of indexes) {
    try {
      const body = await (await get(`https://raw.githubusercontent.com/${index.repo}/HEAD/README.md`)).text();
      const repos = [...new Set([...body.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/g)].map(match => match[1]!.replace(/\.git$/, "")))];
      const pattern = new RegExp(index.pattern, "i");
      let added = 0;
      for (const repo of repos) {
        if (!pattern.test(repo) || knownRepos.has(repo) || repo === index.repo) continue;
        if (added >= 15) break;
        const before = entries.length;
        try { await repository(repo, index.stage, index.kind ?? "project"); } catch { continue; }
        if (entries.length > before) added++;
      }
      successfulSources++;
    } catch { failedSources++; }
  }
  return { entries, successfulSources, failedSources };
}

export function contentHash(body: string) { return createHash("sha256").update(body.trim()).digest("hex"); }

export async function discoverGuides(known: KnowledgeEntry[], sources: FeedSource[], request: typeof fetch = fetch, now = new Date()) {
  const entries: KnowledgeEntry[] = [], links = new Set(known.map(entry => entry.url.replace(/\/$/, "")));
  let successfulSources = 0, failedSources = 0;
  const parser = new XMLParser({ ignoreAttributes: false });
  const plain = plainText;
  for (const source of sources) {
    try {
      const response = await request(source.url, { headers, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Feed HTTP ${response.status}`);
      const parsed = parser.parse(await response.text());
      const items = parsed.rss?.channel?.item;
      if (!items) throw new Error("Not an RSS article list");
      let added = 0;
      for (const item of (Array.isArray(items) ? items : [items])) {
        const title = plain(item.title), url = plain(item.link).replace(/\/$/, "");
        if (!title || !url || links.has(url) || !new RegExp(source.pattern, "i").test(title)) continue;
        const parsedUrl = new URL(url);
        if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== source.host) continue;
        if (added++ >= 10) break;
        links.add(url);
        const description = plain(item.description);
        entries.push({ id: `guide:${url}`, kind: "tutorial", title, summary: description === title || description.length < 35 ? "" : description.slice(0, 180),
          stage: source.stage, prerequisites: "按原站指南准备模型、工具和服务环境", url, checkUrl: url,
          checkedAt: "", status: "unavailable", addedAt: now.toISOString() });
      }
      successfulSources++;
    } catch { failedSources++; }
  }
  return { entries, successfulSources, failedSources };
}

export async function verifyResources(entries: KnowledgeEntry[], existingIds: Set<string>, request: typeof fetch = fetch) {
  const hashes = new Map<string, string>();
  let next = 0;
  async function check() {
    while (next < entries.length) {
      const entry = entries[next++];
      try {
        const response = await request(entry.checkUrl, { signal: AbortSignal.timeout(10000) });
        const body = await response.text();
        entry.status = response.ok && validResource(entry, body) ? "ok" : "unavailable";
        if (entry.status === "ok") {
          if (needsIntroduction(entry.summary)) entry.summary = sourceIntroduction(entry, body) ?? "";
          hashes.set(entry.id, contentHash(body));
        }
      } catch { entry.status = "unavailable"; }
      entry.checkedAt = new Date().toISOString();
    }
  }
  await Promise.all([check(), check(), check(), check()]);
  // Compare new content after all responses, including existing links that answered slowly.
  const seen = new Set(entries.filter(entry => existingIds.has(entry.id)).map(entry => hashes.get(entry.id)).filter(Boolean));
  return entries.filter(entry => {
    if (existingIds.has(entry.id)) return true;
    const hash = hashes.get(entry.id);
    if (entry.status !== "ok" || !hash || seen.has(hash) || needsIntroduction(entry.summary)) return false;
    seen.add(hash);
    return true;
  });
}
