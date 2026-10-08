import assert from "node:assert/strict";
import { test } from "node:test";
import { planSourceImport, type SeedSource } from "@aihot/backend/sources/seed";

const source = (id: string, url: string): SeedSource => ({ id, name: id, kind: "rss", config: { feedUrl: url } });

test("imports preserve edited IDs and detect existing and in-pack address aliases", () => {
  const existing = [source("custom-feed", "https://www.example.org/feed?b=2&a=1&utm_source=old"), source("edited", "https://example.org/changed")];
  const plan = planSourceImport([
    source("pack-alias", "https://example.org/feed?a=1&b=2"),
    source("edited", "https://example.org/original"),
    source("new", "https://other.example.org/feed"),
    source("new-alias", "https://r.jina.ai/https://other.example.org/feed/"),
    source("different-query", "https://example.org/feed?a=1&b=3"),
  ], existing);
  assert.deepEqual(plan.add.map((s) => s.id), ["new", "different-query"]);
  assert.deepEqual(plan.existing, ["edited"]);
  assert.deepEqual(plan.duplicates.map((d) => [d.id, d.existingId]), [["pack-alias", "custom-feed"], ["new-alias", "new"]]);
  assert.equal(existing[1]!.config.feedUrl, "https://example.org/changed");
});

test("push sources without an address remain distinct and different collection kinds follow admin policy", () => {
  const plan = planSourceImport([
    { id: "push-one", name: "One", kind: "external", config: {} },
    { id: "push-two", name: "Two", kind: "external", config: {} },
    { id: "html", name: "HTML", kind: "web_list", config: { url: "https://example.org/feed" } },
  ], [source("rss", "https://example.org/feed")]);
  assert.equal(plan.add.length, 3);
  assert.equal(plan.duplicates.length, 0);
});

test("an invalid later config or repeated ID rejects the entire import plan", () => {
  assert.throws(() => planSourceImport([source("ok", "https://example.org/feed"), { ...source("bad", "https://example.org/bad"), config: { feedUrl: "https://example.org/bad", ignoredSetting: true } }], []), /ignoredSetting/);
  assert.throws(() => planSourceImport([source("same", "https://example.org/one"), source("same", "https://example.org/two")], []), /Duplicate source ID/);
});
