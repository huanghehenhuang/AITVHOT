import assert from "node:assert/strict";
import { test } from "node:test";
import type { KnowledgeEntry } from "../types.ts";
import { discoverGuides, discoverKnowledge, verifyResources } from "../backend/discovery.ts";
import knowledge from "../server.ts";

const base = (id: string, kind: KnowledgeEntry["kind"] = "project"): KnowledgeEntry => ({
  id, kind, title: id, summary: "", stage: "", prerequisites: "", url: `https://github.com/creator/${id}`,
  checkUrl: `https://raw.githubusercontent.com/creator/${id}/HEAD/README.md`, checkedAt: "", status: "unavailable",
});
const readme = "# Image generation\n## Usage\n" + "Configure the documented model and service before rendering. ".repeat(15);

test("daily discovery finds new files and repositories, deduplicates branches and reports failed sources", async () => {
  const existing = { ...base("existing", "skill"), repo: "studio/skills", checkUrl: "https://raw.githubusercontent.com/studio/skills/main/old/SKILL.md" };
  const request = (async (url: string | URL | Request) => {
    const link = String(url);
    if (link.includes("studio/skills/git/trees")) return Response.json({ tree: [{ type: "blob", path: "old/SKILL.md" }, { type: "blob", path: "new/SKILL.md" }] });
    if (link.includes("broken/skills/git/trees")) return new Response("rate limited", { status: 403 });
    if (link.includes("search/repositories")) return Response.json({ items: [
      { full_name: "creator/images", default_branch: "main", description: "Image prompt examples", stargazers_count: 50 },
      { full_name: "creator/fork", default_branch: "main", fork: true },
      { full_name: "creator/empty", default_branch: "main" },
    ] });
    if (link.includes("index/list/HEAD/README")) return new Response("https://github.com/creator/images https://github.com/creator/second-prompt");
    if (link.includes("creator/empty")) return new Response("# Empty repo");
    return new Response(readme);
  }) as typeof fetch;
  const result = await discoverKnowledge([existing], [
    { repo: "studio/skills", pattern: ".*", stage: "导演与分镜" },
    { repo: "broken/skills", pattern: ".*", stage: "导演与分镜" },
  ], [{ query: "image prompts", stage: "图片提示词", kind: "prompt" }], [
    { repo: "index/list", stage: "图片提示词", pattern: "prompt|images", kind: "prompt" },
  ], request, new Date("2026-11-08T00:00:00Z"));
  assert.deepEqual(result.entries.map(entry => entry.id), ["skill:studio/skills:new/SKILL.md", "creator/images", "creator/second-prompt"]);
  assert.equal(result.failedSources, 1);
  assert.equal(result.successfulSources, 3);
  assert.ok(result.entries.every(entry => entry.addedAt === "2026-11-08T00:00:00.000Z"));
});

test("publication rejects malformed skills, non-graph JSON, dead links and duplicate content while retaining existing resources", async () => {
  const old = base("old"), duplicate = base("duplicate"), dead = base("dead"), workflow = base("workflow", "workflow"), invalid = base("invalid", "workflow"), skill = base("skill", "skill"), fake = base("fake", "skill");
  const request = (async (url: string | URL | Request) => {
    const id = String(url).split("/")[4];
    if (id === "old") { await new Promise(resolve => setTimeout(resolve, 25)); return new Response(readme); }
    if (id === "duplicate") return new Response(readme);
    if (id === "dead") return new Response("not found", { status: 404 });
    if (id === "workflow") return Response.json({ nodes: [{ type: "KSampler", widgets_values: Array(40).fill(1) }] });
    if (id === "invalid") return Response.json({ settings: "x".repeat(200) });
    if (id === "skill") return new Response("---\nname: director\ndescription: Plan shots and review continuity.\n---\n" + "# Instructions\n".repeat(20));
    return new Response("# Fake skill\n".repeat(40));
  }) as typeof fetch;
  const result = await verifyResources([old, duplicate, dead, workflow, invalid, skill, fake], new Set(["old", "dead"]), request);
  assert.deepEqual(result.map(entry => entry.id), ["old", "dead", "workflow", "skill"]);
  assert.equal(dead.status, "unavailable");
  assert.ok(result.every(entry => entry.checkedAt));
});

test("daily collection is registered with catch-up and obeys the collection switch", () => {
  const schedule = knowledge.schedules[0]!;
  assert.equal(schedule.cron, "20 5 * * *");
  assert.equal(schedule.missed, "once");
  const previous = process.env.COLLECT_ENABLED;
  try {
    process.env.COLLECT_ENABLED = "false"; assert.equal(schedule.when(), false);
    process.env.COLLECT_ENABLED = "true"; assert.equal(schedule.when(), true);
  } finally { if (previous === undefined) delete process.env.COLLECT_ENABLED; else process.env.COLLECT_ENABLED = previous; }
});

test("official feed discovery accepts matching articles on the source host and rejects unrelated or redirected links", async () => {
  const request = (async () => new Response(`<rss><channel>
    <item><title>Video workflow guide</title><link>https://official.example/video</link><description>Learn video generation.</description></item>
    <item><title>Video workflow duplicate</title><link>https://official.example/video/</link></item>
    <item><title>Video guide</title><link>https://other.example/advert</link></item>
    <item><title>Database internals</title><link>https://official.example/db</link></item>
  </channel></rss>`)) as typeof fetch;
  const result = await discoverGuides([], [{ url: "https://official.example/feed", host: "official.example", stage: "视频教程", pattern: "video" }], request);
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0]?.url, "https://official.example/video");
  assert.equal(result.entries[0]?.kind, "tutorial");
  assert.equal(result.successfulSources, 1);
});
