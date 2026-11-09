import { tag, stub, pointModels } from "./setup.ts";
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { sql, closeDb } from "@aihot/backend/db";
import { localizePending, protectTranslationUrls } from "@aihot/backend/editorial/localize";
import { localizePublication, mapPublicationText, publicationTexts } from "@aihot/backend/publication/localization";
import { stopBoss } from "@aihot/backend/jobs/queue";
import { buildApp } from "../apps/api/src/app.ts";

const T = tag();
const id = `${T}-en`;
const at = new Date(Date.now() - 60_000);
const provider = await stub((_hit, req) => {
  const inputs = JSON.parse(JSON.parse(req.body).messages[1].content) as { id: number; text: string }[];
  const translations = inputs.map((t) => ({ id: t.id, text: `English editorial ${t.id}` }));
  return { choices: [{ message: { content: JSON.stringify({ translations }) } }], usage: { prompt_tokens: 10, completion_tokens: 20 } };
});
pointModels(provider.url, ["deepseek-flash"]);
const app = await buildApp();
before(async () => {
  await sql`INSERT INTO sources (id, name, kind, tier) VALUES (${T}, 'Original source', 'rss', 'T1')`;
  await sql`INSERT INTO articles (id, source_id, identity_key, url, title, discovered_at, timeline_at)
    VALUES (${id}, ${T}, ${id}, 'https://example.org/article', 'Original title', ${at}, ${at})`;
  await sql`INSERT INTO publications (article_id, title, summary, source_id, channel, url, discovered_at, timeline_at, sort_at, eligible, selected, seat, visible_after, visibility)
    VALUES (${id}, ${`中文标题 ${T}`}, ${`中文摘要 ${T}`}, ${T}, 'news', 'https://example.org/article', ${at}, ${at}, ${at}, true, true, true, ${at}, 'public')`;
});
after(async () => { await app.close(); await provider.close(); await stopBoss(); await closeDb(); });

test("projection translates editorial text while preserving original works, source attribution and routing keys", () => {
  const body = { title: "标题", source: { name: "中文信源" }, tags: ["标签"], originalTitle: "原始标题", body: { zh: "原文" }, x: { text: "原帖" }, excerpt: { text: "摘要" }, topics: [{ slug: "工具", name: "工具" }] };
  const projected = mapPublicationText(body, () => "English");
  assert.equal(projected.title, "English");
  assert.equal(projected.excerpt.text, "English");
  assert.equal(projected.topics[0]!.slug, "工具");
  assert.equal(projected.topics[0]!.name, "English");
  assert.deepEqual(projected.body, body.body);
  assert.deepEqual(projected.x, body.x);
  assert.deepEqual(projected.source, body.source);
  assert.deepEqual(projected.tags, body.tags);
  assert.deepEqual(publicationTexts({ summary: "English already", title: "标题" }), ["标题"]);
});

test("source URL tokens must be retained exactly once", () => {
  const protectedText = protectTranslationUrls("报道 [来源](https://example.org/a?q=1) 和 https://other.example/b");
  assert.equal(protectedText.restore(protectedText.text), "报道 [来源](https://example.org/a?q=1) 和 https://other.example/b");
  assert.throws(() => protectedText.restore("English without a citation"));
});

test("worker persists paid English; public reads never pay, and revisions and withdrawals take effect immediately", async () => {
  const pending = await app.inject(`/api/site/items/${id}?lang=en`);
  assert.equal(pending.statusCode, 200);
  assert.equal(pending.headers["x-translation-complete"], "false");
  assert.equal(provider.hits(), 0);
  const result = await localizePending(100);
  assert.ok(result.translated > 0);
  const calls = provider.hits();
  assert.ok(calls > 0);
  const english = await app.inject(`/api/site/items/${id}?lang=en`);
  assert.equal(english.headers["x-translation-complete"], "true");
  assert.match(english.json().summary, /^English editorial/);
  assert.match(String(english.headers["cache-control"]), /^private, max-age=60, must-revalidate$/);
  const chinese = await app.inject(`/api/site/items/${id}`);
  assert.equal(chinese.json().summary, `中文摘要 ${T}`);
  const [{ count }] = await sql<{ count: number }[]>`SELECT count(*)::int AS count FROM receipts WHERE purpose = 'translate_publication' AND status = 'completed'`;
  assert.ok(count > 0);
  assert.deepEqual(await localizePending(100), { translated: 0, batches: 0 });
  await sql`UPDATE publications SET summary = ${`更正后的摘要 ${T}`} WHERE article_id = ${id}`;
  const revised = await app.inject(`/api/site/items/${id}?lang=en`);
  assert.equal(revised.headers["x-translation-complete"], "false");
  assert.equal(revised.json().summary, `更正后的摘要 ${T}`);
  const revision = await localizePublication({ summary: `更正后的摘要 ${T}` });
  assert.equal(revision.complete, false);
  assert.equal(provider.hits(), calls);
  await sql`UPDATE publications SET visibility = 'withdrawn' WHERE article_id = ${id}`;
  assert.equal((await app.inject(`/api/site/items/${id}?lang=en`)).statusCode, 404);
});
