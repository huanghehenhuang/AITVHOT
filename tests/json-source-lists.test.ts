import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { closeDb } from "@aihot/backend/db";
import { fetchJsonList } from "@aihot/backend/sources/json-list";
import type { SourceRow } from "@aihot/backend/sources/types";

const posts = [
  { title: 'A model with "quotes" and a ] bracket', href: "/news/model", date: "2026-09-30T17:00:00Z", tags: ["video", "research"], nested: { versions: [1, 2] } },
  { title: "A film workflow", href: "/news/workflow", date: "2026-10-01T12:00:00Z", tags: [] },
];
const flight = `a:["$","$L1",null,${JSON.stringify({ label: { posts: "A label, not the list" }, posts, unrelated: ["later"] })}]\n`;
const pages: Record<string, string> = {
  "/flight": `<script>self.__next_f.push([1,${JSON.stringify(flight)}]);</script>`,
  "/window": `<script>window.newsState = ${JSON.stringify({ data: { posts } })};</script>`,
  "/plain": `<script type="application/json">${JSON.stringify({ data: { posts } })}</script>`,
  "/broken": `<script>self.__next_f.push([1,${JSON.stringify('a:{"posts":[{"title":"Incomplete"}')}]);</script>`,
  "/mixed": JSON.stringify([{ title: "Number", href: "/n", date: 1790787600000 }, { title: "Numeric string", href: "/s", date: "1790787600000" }, { title: "ISO", href: "/i", date: "2026-09-30T17:00:00.000Z" }, { title: "Bad", href: "/bad", date: "invalid" }]),
};
const server = http.createServer((req, res) => res.end(pages[req.url ?? ""] ?? ""));
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const wasPrivate = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
after(async () => {
  config.allowPrivateNetworkFetch = wasPrivate;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closeDb();
});
const source = (path: string, settings: Record<string, unknown>): SourceRow => ({
  id: "local-json", name: "Local JSON", kind: "json_list", tier: "T1", participation_mode: "editorial",
  first_party: true, interval_minutes: 60, enabled: true, cursor: null, fail_count: 0,
  config: { url: base + path, titlePaths: ["title"], urlTemplate: "https://example.com{raw:href}", publishedAtPath: "date", ...settings },
});

test("Flight lists preserve every post through nested arrays, escaped quotes and brackets in text", async () => {
  const items = await fetchJsonList(source("/flight", { mode: "html_json_key", jsonKey: "posts" }));
  assert.deepEqual(items.map((c) => [c.title, c.url, c.publishedAt?.toISOString()]), posts.map((p) => [p.title, "https://example.com" + p.href, new Date(p.date).toISOString()]));
});

test("ordinary JSON script blocks and window objects retain their nested-list behavior", async () => {
  for (const [path, settings] of [["/plain", { mode: "html_json_key", jsonKey: "posts" }], ["/window", { mode: "html_window_var", windowVar: "newsState", itemsPath: "data.posts" }]] as const) {
    assert.deepEqual((await fetchJsonList(source(path, settings))).map((c) => c.title), posts.map((p) => p.title));
  }
  await assert.rejects(fetchJsonList(source("/broken", { mode: "html_json_key", jsonKey: "posts" })), /embedded key posts not found/);
});

test("mixed millisecond and ISO dates use an explicit unit without changing existing numeric-only units", async () => {
  const items = await fetchJsonList(source("/mixed", { publishedAtUnit: "epoch_ms_or_iso" }));
  assert.deepEqual(items.map((c) => c.publishedAt?.toISOString() ?? null), ["2026-09-30T17:00:00.000Z", "2026-09-30T17:00:00.000Z", "2026-09-30T17:00:00.000Z", null]);
  const numericOnly = await fetchJsonList(source("/mixed", { publishedAtUnit: "epoch_ms" }));
  assert.equal(numericOnly[2]!.publishedAt, null, "ISO support is opt-in for APIs with mixed date formats");
});
