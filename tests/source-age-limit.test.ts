import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import http from "node:http";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { closeDb, sql } from "@aihot/backend/db";
import { collectSource } from "@aihot/backend/sources/collect";
import { assertSupportedConfig } from "@aihot/backend/sources/config-keys";
import { stopBoss } from "@aihot/backend/jobs/queue";

const T = tag();
const now = Date.now();
const date = (days: number) => new Date(now - days * 86400_000).toUTCString();
const server = http.createServer((req, res) => {
  if (req.url === "/detail-recent") {
    res.setHeader("Content-Type", "text/html");
    res.end(`<html><body><time datetime="${new Date(now - 2 * 86400_000).toISOString()}">Recent</time></body></html>`);
    return;
  }
  if (req.url === "/authority") {
    res.setHeader("Content-Type", "application/rss+xml");
    res.end(`<rss version="2.0"><channel><title>News</title><item><title>Incorrect list date</title><link>http://127.0.0.1:${(server.address() as { port: number }).port}/detail-recent</link><pubDate>${date(40)}</pubDate></item></channel></rss>`);
    return;
  }
  const prefix = `https://example.com/age-${T}${req.url}`;
  res.setHeader("Content-Type", "application/rss+xml");
  res.end(`<rss version="2.0"><channel><title>News</title>
    <item><title>Old release</title><link>${prefix}/old</link><pubDate>${date(40)}</pubDate></item>
    <item><title>Recent release</title><link>${prefix}/recent</link><pubDate>${date(2)}</pubDate></item>
    <item><title>Undated release</title><link>${prefix}/undated</link></item>
    </channel></rss>`);
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
const root = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
const previousPrivateFetch = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
after(async () => {
  config.allowPrivateNetworkFetch = previousPrivateFetch;
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await stopBoss();
  await closeDb();
});

async function source(id: string, maxItemAgeDays?: number) {
  const settings = { feedUrl: `${root}/${id}`, ...(maxItemAgeDays === undefined ? {} : { maxItemAgeDays }), _aihot: { initialBackfillLimit: 1 } };
  await sql`INSERT INTO sources (id, name, kind, config) VALUES (${id}, ${id}, 'rss', ${sql.json(settings)})`;
}

test("dated old material stays out on later rounds, while undated and recent items still enter", async () => {
  const id = `age-bounded-${T}`;
  await source(id, 30);
  assert.equal((await collectSource(id)).created, 1, "the old first feed entry must not crowd out recent news");
  assert.equal((await collectSource(id)).created, 1, "the next round admits undated material, not the skipped old release");
  assert.equal((await collectSource(id)).created, 0, "unchanged entries remain idempotent");
  const rows = await sql<{ title: string }[]>`SELECT title FROM articles WHERE source_id = ${id} ORDER BY title`;
  assert.deepEqual(rows.map((row) => row.title), ["Recent release", "Undated release"]);
});

test("sources without a date window retain their ordinary backfill behavior", async () => {
  const id = `age-unbounded-${T}`;
  await source(id);
  assert.equal((await collectSource(id)).created, 1);
  assert.equal((await collectSource(id)).created, 2);
  assert.equal((await sql`SELECT 1 FROM articles WHERE source_id = ${id}`).length, 3);
});

test("an unreliable listing date cannot discard an article whose authoritative detail is recent", async () => {
  const id = `age-authority-${T}`;
  const settings = { feedUrl: `${root}/authority`, maxItemAgeDays: 30, detail: { maxFetches: 1, publishedAtSelector: "time", publishedAtAuthoritative: true } };
  await sql`INSERT INTO sources (id, name, kind, config) VALUES (${id}, ${id}, 'rss', ${sql.json(settings)})`;
  assert.equal((await collectSource(id)).created, 1);
  const [row] = await sql<{ published_at: Date }[]>`SELECT published_at FROM articles WHERE source_id = ${id}`;
  assert.equal(row!.published_at.getTime(), now - 2 * 86400_000);
});

test("invalid date-window values are rejected instead of silently disabling the limit", () => {
  for (const maxItemAgeDays of [0, -1, "30", null, Infinity]) {
    assert.throws(() => assertSupportedConfig("rss", { feedUrl: "https://example.com/feed", maxItemAgeDays }), /maxItemAgeDays/);
  }
  assertSupportedConfig("rss", { feedUrl: "https://example.com/feed", maxItemAgeDays: 30 });
});
