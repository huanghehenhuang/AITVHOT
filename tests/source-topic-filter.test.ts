import assert from "node:assert/strict";
import { after, test } from "node:test";
import { noiseFiltered } from "@aihot/backend/sources/filters";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { closeDb } from "@aihot/backend/db";
import type { SourceRow } from "@aihot/backend/sources/types";

const source = (settings: Record<string, unknown>): SourceRow => ({
  id: "mixed-feed", name: "Mixed feed", kind: "rss", config: settings, tier: "T2",
  participation_mode: "editorial", first_party: false, interval_minutes: 60,
  enabled: true, cursor: null, fail_count: 0,
});
const item = (title: string, excerpt?: string) => ({ title, url: "https://example.com/article", excerpt });
after(closeDb);

test("topic markers match title or excerpt without case sensitivity, and existing drop rules still apply", () => {
  const s = source({ ingestNoiseFilter: { requireMarkers: ["veo", "配音"], dropMarkersTitleOnly: ["sponsored"], keepIfMatches: ["research"] } });
  assert.equal(noiseFiltered(item("New VEO workflow"), s), false);
  assert.equal(noiseFiltered(item("A new workflow", "角色配音与音画同步"), s), false);
  assert.equal(noiseFiltered(item("Research on database agents"), s), true, "an exemption cannot bypass the required topic scope");
  assert.equal(noiseFiltered(item("Sponsored VEO roundup"), s), true);
  assert.equal(noiseFiltered(item("Sponsored VEO research"), s), false, "the old drop-rule exemption remains effective inside the topic scope");
  assert.equal(noiseFiltered({ ...item("VEO release"), categories: ["Ads"] }, source({ denyCategories: ["Ads"], ingestNoiseFilter: s.config.ingestNoiseFilter })), true);
});

test("sources without required markers retain their previous filtering behavior", () => {
  assert.equal(noiseFiltered(item("Enterprise database update"), source({})), false);
  assert.equal(noiseFiltered(item("Sponsored database research"), source({ ingestNoiseFilter: { dropMarkers: ["sponsored"], keepIfMatches: ["research"] } })), false);
});

test("invalid required markers fail validation instead of broadening a feed silently", () => {
  for (const requireMarkers of [[], null, "video", [""], ["   "], [1]]) {
    assert.throws(() => assertSupportedConfig("rss", { ingestNoiseFilter: { requireMarkers } }), /requireMarkers/);
  }
  assertSupportedConfig("rss", { ingestNoiseFilter: { requireMarkers: ["视频", "image"] } });
});

test("ASCII word gates retain AI and Udio coverage without matching audio, paid, air or trailing name fragments", () => {
  const s = source({ ingestNoiseFilter: { requireWords: ["ai", "udio"], requireMarkers: ["生成式"], keepIfMatches: ["research"] } });
  for (const title of ["AI restores a film", "AI: new editing tool", "音乐平台Udio更新", "Udio 2.0 release", "(AI) sound design", "生成式音效研究"]) {
    assert.equal(noiseFiltered(item(title), s), false, title);
  }
  assert.equal(noiseFiltered(item("New platform", "Uses AI for sound generation"), s), false);
  for (const title of ["Audio interface review", "Paid audio subscription", "Air compressor guide", "Research on studio acoustics", "RAIL release"]) {
    assert.equal(noiseFiltered(item(title), s), true, title);
  }
  assert.equal(noiseFiltered(item("Sponsored AI tool"), source({ ingestNoiseFilter: { requireWords: ["ai"], dropMarkers: ["sponsored"] } })), true);
});

test("invalid word gates fail validation and literal markers keep their substring semantics", () => {
  for (const requireWords of [[], null, "ai", [""], [" ai "], ["a.i."], ["视频"], [".*"], [1]]) {
    assert.throws(() => assertSupportedConfig("rss", { ingestNoiseFilter: { requireWords } }), /requireWords/);
  }
  assertSupportedConfig("rss", { ingestNoiseFilter: { requireWords: ["AI", "udio", "ai-powered"] } });
  assert.equal(noiseFiltered(item("Audio tool"), source({ ingestNoiseFilter: { requireMarkers: ["udio"] } })), false);
});
