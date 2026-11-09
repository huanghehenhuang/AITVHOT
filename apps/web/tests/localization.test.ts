import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { pageMeta, siteLd } from "../app/lib/seo.ts";
import { renderMarkdown } from "../app/lib/markdown.ts";
import { startWebServer } from "./web-server.ts";

test("English canonical is independent, hreflang is reciprocal, pending translations are noindex and license is versioned", () => {
  const meta = pageMeta({ path: "/story/test", locale: "en", translationReady: false });
  const json = JSON.stringify(meta);
  assert.match(json, /story\/test\?lang=en/);
  assert.match(json, /zh-CN/);
  assert.match(json, /x-default/);
  assert.match(json, /noindex, follow/);
  const dataset = siteLd("en").find((v) => v["@type"] === "Dataset")!;
  assert.ok("license" in dataset && "keywords" in dataset);
  assert.match(JSON.stringify(dataset.license), /terms#data-license-v1/);
  assert.ok(dataset.keywords?.some((v) => /\p{Script=Han}/u.test(v)));
  assert.ok(dataset.keywords?.some((v) => /[a-z]/i.test(v)));
  assert.match(renderMarkdown("## License v1 {#data-license-v1}", "https://example.org").html, /id="data-license-v1"/);
});

test("concurrent SSR requests carry isolated locales, completion flags and cache policies", async () => {
  const api = createServer((req, res) => {
    const url = new URL(req.url!, "http://api.local");
    const en = url.searchParams.get("lang") === "en";
    res.setHeader("Content-Type", "application/json");
    if (url.pathname === "/api/site/meta") return res.end('{"changelogVersion":"test"}');
    if (en) res.setHeader("X-Translation-Complete", "false");
    res.end(JSON.stringify({ filters: { channel: "all", category: null, tag: null }, cards: [], hot: null, dayCounts: {}, nextCursor: null }));
  });
  const web = await startWebServer(api, { TRUST_PROXY: "true" });
  try {
    const [en, zh, geo, bot] = await Promise.all([
      fetch(`${web.origin}/?lang=en`),
      fetch(`${web.origin}/?lang=zh`, { headers: { cookie: "locale=en" } }),
      fetch(web.origin, { headers: { "cf-ipcountry": "US", "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" } }),
      fetch(web.origin, { headers: { "cf-ipcountry": "US", "user-agent": "Googlebot" } }),
    ]);
    const english = await en.text(), chinese = await zh.text();
    assert.match(english, /<html lang="en"/);
    assert.match(english, /English translation is being prepared/);
    assert.match(english, /noindex, follow/);
    assert.match(chinese, /<html lang="zh-CN"/);
    assert.doesNotMatch(chinese, /English translation is being prepared/);
    assert.equal(geo.headers.get("content-language"), "en");
    assert.equal(bot.headers.get("content-language"), "zh-CN");
    assert.match(en.headers.get("cache-control")!, /^private, max-age=\d+, must-revalidate$/);
    assert.match(geo.headers.get("cache-control")!, /^private, max-age=\d+, must-revalidate$/);
    assert.equal(en.headers.get("x-accel-expires"), "0");
  } finally { await web.stop(); }
});
