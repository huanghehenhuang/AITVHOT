import assert from "node:assert/strict";
import { after, test } from "node:test";
import http from "node:http";
import { config } from "@aihot/backend/config";
import { fromHtml, fetchWebList } from "@aihot/backend/sources/web-list";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { closeDb } from "@aihot/backend/db";
import type { SourceRow } from "@aihot/backend/sources/types";

const base = "https://publisher.example/news/";
const source = (config: Record<string, unknown>): SourceRow => ({
  id: "public-news", name: "Public news", kind: "web_list", tier: "T1", first_party: true,
  participation_mode: "editorial", interval_minutes: 360, enabled: true, cursor: null, fail_count: 0,
  config: { url: base, itemSelector: "li", titleSelector: "a", publishedAtSelector: "time", ...config },
});
after(closeDb);

test("selected XML CDATA rows retain dates, resolve links and deduplicate without reading outside navigation", () => {
  const html = `<li><a href="/outside">Outside navigation</a></li>
    <script type="text/xml" id="news"><datastore><recordset>
    <record><![CDATA[<li><a href="/articles/short-drama">微短剧备案通知</a><time>2026-10-08</time></li>]]></record>
    <record><![CDATA[<li><a href="/articles/short-drama">Duplicate</a></li>]]></record>
    <record><![CDATA[<li><a href="/articles/cartoon">漫剧创作扶持</a><time>2026年10月07日</time></li>]]></record>
    </recordset></datastore></script>
    <script type="text/xml"><record><![CDATA[<li><a href="/unselected">Unselected</a></li>]]></record></script>
    <script>globalThis.embeddedListScriptRan = true;</script>`;
  const items = fromHtml(html, base, source({ embeddedHtmlSelector: "script#news" }));
  assert.deepEqual(items.map((x) => [x.url, x.title, x.publishedAt?.toISOString()]), [
    ["https://publisher.example/articles/short-drama", "微短剧备案通知", "2026-10-08T00:00:00.000Z"],
    ["https://publisher.example/articles/cartoon", "漫剧创作扶持", "2026-10-06T16:00:00.000Z"],
  ]);
  assert.equal((globalThis as Record<string, unknown>).embeddedListScriptRan, undefined);
});

test("missing or changed embedded blocks do not fall back to unrelated page links", () => {
  for (const html of ["<li><a href='/menu'>Menu</a></li>", "<script id='news'>window.rows = [];</script><li><a href='/menu'>Menu</a></li>"])
    assert.deepEqual(fromHtml(html, base, source({ embeddedHtmlSelector: "script#news" })), []);
});

test("data-link cards use their declared attribute and preserve URL boundaries; ordinary href lists still work", () => {
  const s = source({ itemSelector: ".card", linkSelector: ".title", linkAttribute: "data-link", titleSelector: ".title", allowUrlPrefixes: ["https://publisher.example/articles/"] });
  const html = `<div class="card"><div class="title" data-link="/articles/ai-drama">AI短剧出海</div><time>2026-10-08</time></div>
    <div class="card"><div class="title" data-link="javascript:alert(1)">Bad URL</div></div>
    <div class="card"><div class="title" data-link="https://other.example/story">Outside scope</div></div>`;
  const items = fromHtml(html, base, s);
  assert.equal(items.length, 1);
  assert.equal(items[0]!.url, "https://publisher.example/articles/ai-drama");
  assert.equal(items[0]!.publishedAt?.toISOString(), "2026-10-08T00:00:00.000Z");
  assert.equal(fromHtml("<li><a href='/legacy'>Legacy</a></li>", base, source({}))[0]!.url, "https://publisher.example/legacy");
});

test("embedded-list and link-attribute settings are validated and restricted to HTML sources", () => {
  assertSupportedConfig("web_list", { embeddedHtmlSelector: "script[type='text/xml']", linkAttribute: "data-link" });
  for (const embeddedHtmlSelector of [null, 1, "", "   "])
    assert.throws(() => assertSupportedConfig("web_list", { embeddedHtmlSelector }), /embeddedHtmlSelector/);
  for (const linkAttribute of [null, 1, "", "data link", "[href]", " href"])
    assert.throws(() => assertSupportedConfig("web_list", { linkAttribute }), /linkAttribute/);
  assert.throws(() => assertSupportedConfig("rss", { embeddedHtmlSelector: "script" }), /embeddedHtmlSelector/);
});

test("public form lists send encoded parameters and map article IDs to canonical links without executing JavaScript", async () => {
  const server = http.createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += String(chunk);
    assert.equal(req.method, "POST");
    assert.equal(req.headers["content-type"], "application/x-www-form-urlencoded");
    assert.equal(body, "page_no=1&search=%E6%BC%AB%E5%89%A7+%26+AI");
    res.end(`<li id="71118"><h2>漫剧制作复盘</h2><!-- 原始发布时间：2026-09-30 13:14:59 --></li>`);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const previous = config.allowPrivateNetworkFetch;
  config.allowPrivateNetworkFetch = true;
  try {
    const items = await fetchWebList(source({
      url: `http://127.0.0.1:${(server.address() as { port: number }).port}/list`,
      method: "POST", bodyForm: { page_no: "1", search: "漫剧 & AI" },
      linkSelector: "li", linkAttribute: "id", linkTemplate: "https://publisher.example/news/details?id={value}",
      titleSelector: "h2", publishedAtRegex: "(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})",
    }));
    assert.deepEqual(items.map((x) => [x.url, x.title, x.publishedAt?.toISOString()]), [
      ["https://publisher.example/news/details?id=71118", "漫剧制作复盘", "2026-09-30T05:14:59.000Z"],
    ]);
    const encoded = fromHtml('<li id="bad&id=2"><h2>Literal ID</h2></li>', base, source({ linkSelector: "li", linkAttribute: "id", linkTemplate: "https://publisher.example/news?id={value}", titleSelector: "h2" }));
    assert.equal(encoded[0]!.url, "https://publisher.example/news?id=bad%26id%3D2");
  } finally {
    config.allowPrivateNetworkFetch = previous;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("form-list configuration refuses ambiguous bodies and unsupported request methods", () => {
  assertSupportedConfig("web_list", { method: "POST", bodyForm: { page_no: "1" }, linkTemplate: "https://publisher.example/article/{value}" });
  for (const bodyForm of [null, [], { page_no: 1 }, { nested: {} }])
    assert.throws(() => assertSupportedConfig("web_list", { method: "POST", bodyForm }), /bodyForm/);
  assert.throws(() => assertSupportedConfig("web_list", { method: "GET", bodyForm: {} }), /bodyForm/);
  assert.throws(() => assertSupportedConfig("web_list", { method: "PUT" }), /method/);
  assert.throws(() => assertSupportedConfig("web_list", { linkTemplate: "/article/no-id" }), /linkTemplate/);
});
