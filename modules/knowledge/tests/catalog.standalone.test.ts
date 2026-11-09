import assert from "node:assert/strict";
import { test } from "node:test";
import { loadKnowledge, readCatalog } from "../backend/publication.ts";

test("knowledge contains all five resource types and verified original HTTPS links", async () => {
  const catalog = await readCatalog();
  assert.ok(catalog.entries.length >= 25);
  assert.equal(new Set(catalog.entries.map(entry => entry.id)).size, catalog.entries.length);
  for (const kind of ["tutorial", "skill", "project", "prompt", "workflow"]) assert.ok(catalog.entries.some(entry => entry.kind === kind));
  for (const entry of catalog.entries) {
    assert.equal(new URL(entry.url).protocol, "https:");
    assert.ok(entry.checkedAt);
    if (entry.kind === "skill") assert.match(entry.checkUrl, /SKILL\.md$/);
  }
});

test("recent collection filters use added dates and sort new resources first", async () => {
  const all = await loadKnowledge(new URLSearchParams({ sort: "added" }));
  const recent = await loadKnowledge(new URLSearchParams({ recent: "7", sort: "added", kind: "workflow" }));
  assert.equal(recent.filters.recent, "7");
  assert.equal(recent.counts.workflow, all.counts.workflow);
  assert.ok(recent.entries.every(entry => entry.kind === "workflow" && Date.parse(entry.addedAt ?? "") >= Date.now() - 7 * 86400000));
  const dates = all.entries.map(entry => Date.parse(entry.addedAt ?? "") || 0);
  assert.deepEqual(dates, [...dates].sort((a, b) => b - a));
  const invalid = await loadKnowledge(new URLSearchParams({ recent: "-10" }));
  assert.equal(invalid.filters.recent, "");
});
test("director, prompt and workflow shortcuts resolve to their own typed resources", async () => {
  const director = await loadKnowledge(new URLSearchParams({ kind: "skill", stage: "导演与分镜" }));
  assert.ok(director.matchedTotal > 0);
  const prompts = await loadKnowledge(new URLSearchParams({ kind: "prompt" }));
  assert.ok(prompts.counts.prompt > 0);
  assert.ok(prompts.entries.every(entry => entry.kind === "prompt"));
  const workflows = await loadKnowledge(new URLSearchParams({ kind: "workflow" }));
  assert.ok(workflows.counts.workflow >= 50);
  assert.ok(workflows.entries.every(entry => entry.checkUrl.endsWith(".json")));
});
test("knowledge search intersects type and stage and preserves corpus counts on empty results", async () => {
  const all = await loadKnowledge(new URLSearchParams());
  const skill = await loadKnowledge(new URLSearchParams({ kind: "skill", q: "分镜" }));
  assert.ok(skill.entries.length > 0);
  assert.ok(skill.entries.every(entry => entry.kind === "skill"));
  const empty = await loadKnowledge(new URLSearchParams({ q: "no-such-knowledge-57351" }));
  assert.equal(empty.entries.length, 0);
  assert.equal(empty.total, all.total);
  assert.deepEqual(empty.counts, all.counts);
});
test("pagination retains matching totals, separates pages, and clamps out-of-range requests", async () => {
  const first = await loadKnowledge(new URLSearchParams({ kind: "project" }));
  const second = await loadKnowledge(new URLSearchParams({ kind: "project", page: "2" }));
  assert.equal(first.entries.length, 36);
  assert.ok(first.pages > 1);
  assert.equal(first.matchedTotal, second.matchedTotal);
  const ids = new Set(first.entries.map(entry => entry.id));
  assert.ok(second.entries.every(entry => !ids.has(entry.id)));
  const last = await loadKnowledge(new URLSearchParams({ kind: "project", page: "999" }));
  assert.equal(last.page, last.pages);
  assert.ok(last.entries.length > 0);
});
test("source, license and access filters intersect and stay available across pages", async () => {
  const result = await loadKnowledge(new URLSearchParams({
    source: "zenstory-ai/drama-skills", license: "MIT", status: "ok", kind: "skill", sort: "title",
  }));
  assert.ok(result.entries.length > 0);
  assert.ok(result.entries.every(entry => entry.repo === "zenstory-ai/drama-skills" && entry.license === "MIT" && entry.status === "ok"));
  assert.equal(result.filters.source, "zenstory-ai/drama-skills");
  assert.equal(result.filters.sort, "title");
  assert.ok(result.sources.includes("zenstory-ai/drama-skills"));
  assert.ok(result.licenses.includes("MIT"));
  const unknown = await loadKnowledge(new URLSearchParams({ license: "unknown" }));
  assert.ok(unknown.entries.every(entry => !entry.license));
});
