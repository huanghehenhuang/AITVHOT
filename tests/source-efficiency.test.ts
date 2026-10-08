import { tag } from "./setup.ts";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import type { AdminSourceCost } from "@aihot/contracts/admin";
import { closeDb, sql } from "@aihot/backend/db";
import { sourceEfficiency } from "@aihot/backend/admin/source-efficiency";
import { upsertMaterial } from "@aihot/backend/content/materials";
import { config } from "@aihot/backend/config";
import { endSession, passwordLogin, SESSION_COOKIE } from "@aihot/backend/admin/auth";
import { buildApp } from "../apps/api/src/app.ts";

const T = tag();
const at = new Date();
const day = 86400_000;
const sources = { a: `eff-a-${T}`, b: `eff-b-${T}`, signal: `eff-signal-${T}`, isolated: `eff-isolated-${T}` };
const service = `eff-model-${T}`;
const baseline = await sourceEfficiency(7, at);
for (const [key, id] of Object.entries(sources)) {
  await sql`INSERT INTO sources (id, name, kind, participation_mode) VALUES (${id}, ${id}, 'rss', ${key === "signal" ? "hot_signal" : key === "isolated" ? "isolated" : "editorial"})`;
}
const [story] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title) VALUES (${randomUUID()}, 'Shared event') RETURNING id`;
const [oldStory] = await sql<{ id: number }[]>`INSERT INTO stories (public_id, title) VALUES (${randomUUID()}, 'Older event') RETURNING id`;
after(closeDb);

async function material(sourceId: string, age = 1, options: { storyId?: number | null; withdrawn?: boolean; eligible?: boolean; future?: boolean } = {}) {
  const date = new Date(at.getTime() - age * day);
  const { articleId } = await upsertMaterial({ sourceId, url: `https://example.com/eff/${tag()}`, title: "Source yield", via: "fetch", discoveredAt: date, publishedAt: date });
  await sql`INSERT INTO publications (article_id, source_id, title, channel, url, discovered_at, timeline_at, sort_at, eligible, selected, visibility, story_id, visible_after)
    VALUES (${articleId}, ${sourceId}, 'Source yield', 'news', 'https://example.com/item', ${date}, ${date}, ${date}, ${options.eligible ?? true}, true,
            ${options.withdrawn ? "withdrawn" : "public"}, ${options.storyId ?? null}, ${options.future ? new Date(at.getTime() + day) : date})`;
  return articleId;
}

const article = await material(sources.a, 1, { storyId: story!.id });
await material(sources.a, 2, { storyId: story!.id });
await material(sources.b, 7, { storyId: story!.id }); // Inclusive start of the seven-day window.
await material(sources.a); // A selected item without a group is not an event.
await material(sources.a, 1, { storyId: oldStory!.id, withdrawn: true });
await material(sources.a, 1, { storyId: oldStory!.id, eligible: false });
await material(sources.a, 1, { storyId: oldStory!.id, future: true });
await material(sources.signal, 1, { storyId: oldStory!.id });
await material(sources.isolated, 1, { storyId: oldStory!.id });
await material(sources.a, 8, { storyId: oldStory!.id });
await material(sources.a, 0, { storyId: oldStory!.id }); // Exclusive end.

interface Attempt {
  cost?: number; currency?: string; basis?: "actual" | "estimated"; usage?: unknown;
  status?: "received" | "failed" | "unknown" | "pending"; origin?: "live" | "replay" | "imported"; age?: number;
}
async function receipt(subject: string, provider: string, attempts: Attempt[], model: string | null = null, purpose = "source_fetch") {
  const [r] = await sql<{ id: number }[]>`INSERT INTO receipts (logical_key, service, model, purpose, subject, status, attempts)
    VALUES (${`eff-${tag()}`}, ${provider}, ${model}, ${purpose}, ${subject}, 'completed', ${attempts.length}) RETURNING id`;
  for (const [index, attempt] of attempts.entries()) {
    await sql`INSERT INTO receipt_attempts (receipt_id, attempt, service, model, status, origin, cost, currency, cost_basis, usage, started_at)
      VALUES (${r!.id}, ${index + 1}, ${provider}, ${model}, ${attempt.status ?? "received"}, ${attempt.origin ?? "live"},
              ${attempt.cost ?? null}, ${attempt.currency ?? null}, ${attempt.basis ?? null}, ${attempt.usage ? sql.json(attempt.usage as never) : null},
              ${new Date(at.getTime() - (attempt.age ?? 1) * day)})`;
  }
}

function cost(rows: AdminSourceCost[], stage: AdminSourceCost["stage"], currency: string | null) {
  const row = rows.find((row) => row.stage === stage && row.currency === currency);
  assert.ok(row, `missing ${stage}/${currency}`);
  return row;
}

test("source yield deduplicates events across articles and excludes nonpublic output", async () => {
  const data = await sourceEfficiency(7, at);
  const a = data.rows.find((row) => row.id === sources.a)!;
  const b = data.rows.find((row) => row.id === sources.b)!;
  assert.equal(a.items, 6);
  assert.equal(a.selected, 3);
  assert.equal(a.events, 1);
  assert.equal(a.ungrouped, 1);
  assert.equal(b.selected, 1);
  assert.equal(b.events, 1);
  for (const id of [sources.signal, sources.isolated]) assert.equal(data.rows.find((row) => row.id === id)!.selected, 0);
  assert.equal(data.totals.items, baseline.totals.items + 9);
  assert.equal(data.totals.selected, baseline.totals.selected + 4);
  assert.equal(data.totals.events, baseline.totals.events + 1, "two sources contribute the same event only once globally");
  assert.equal(data.totals.ungrouped, baseline.totals.ungrouped + 1);
  const longer = await sourceEfficiency(30, at);
  assert.equal(longer.rows.find((row) => row.id === sources.a)!.events, 2);
});

test("costs keep currencies, revisions, retries, cache pricing and missing amounts separate", async () => {
  await sql`INSERT INTO service_prices (service, model, currency, input_per_mtok, cached_per_mtok, output_per_mtok)
    VALUES (${service}, 'chat', 'CNY', 2, 1, 4), (${service}, '', 'USD', 10, NULL, 20), (${service}, 'embed', 'CNY', 1, NULL, NULL)`;
  await receipt(`source:${sources.a}`, "socialdata", [{ cost: 0.002, currency: "USD", basis: "estimated" }]);
  await receipt(sources.a, "dajiala", [{ cost: 0.14, currency: "CNY", basis: "actual" }]);
  const usage = { prompt_tokens: 100, completion_tokens: 50, prompt_tokens_details: { cached_tokens: 20 } };
  await receipt(`article:${article}@2`, service, [{ usage, status: "failed" }, { usage }], "chat", "score_article");
  await receipt(`article:${article}@2#0`, service, [{ cost: 0.2, currency: "USD", basis: "actual", usage }], "chat", "translate_body");
  await receipt(`article:${article}:fact:42`, service, [{ cost: 0.01, currency: "USD", basis: "estimated" }], "chat", "group_review");
  await receipt(`article:${article}`, service, [{ usage: { total_tokens: 1000 } }], "embed", "embedding");
  await receipt(`article:${article}`, service, [{ usage: { prompt_tokens: 100, completion_tokens: 50, prompt_cache_hit_tokens: 20 } }], "chat", "prefilter_article");
  await receipt(`article:${article}`, service, [{ usage: { prompt_tokens: 100, completion_tokens: 50 } }], "fallback", "summarize_article");
  await receipt(`article:${article}`, service, [{ usage: { prompt_tokens: "invalid", completion_tokens: 50 } }, { status: "unknown" }, { status: "pending" }], "chat", "structure_article");
  await receipt(`article:${article}`, `${service}-unpriced`, [{ usage }], "chat", "understand_article");
  await receipt(`article:${article}`, service, [{ cost: 999, currency: "CNY", basis: "actual", origin: "replay" }, { cost: 999, currency: "CNY", basis: "actual", origin: "imported" }], "chat");
  await receipt(`source:${sources.a}`, "socialdata", [{ cost: 99, currency: "USD", basis: "actual", age: 8 }, { cost: 99, currency: "USD", basis: "actual", age: 0 }]);
  await receipt(`x-shard:${T}`, "socialdata", [{ cost: 0.02, currency: "USD", basis: "estimated" }]);
  await receipt(`report:daily:${T}`, service, [{ cost: 0.03, currency: "CNY", basis: "actual" }], "chat", "report_lead");
  const data = await sourceEfficiency(7, at);
  const a = data.rows.find((row) => row.id === sources.a)!;
  assert.equal(cost(a.costs, "collection", "USD").estimated, 0.002);
  assert.equal(cost(a.costs, "collection", "CNY").actual, 0.14);
  assert.ok(Math.abs(cost(a.costs, "model", "CNY").estimated - 0.00214) < 1e-9);
  assert.equal(cost(a.costs, "model", "CNY").actual, 0);
  assert.equal(cost(a.costs, "model", "USD").actual, 0.2, "an actual cost overrides a token estimate");
  assert.ok(Math.abs(cost(a.costs, "model", "USD").estimated - 0.012) < 1e-9);
  assert.equal(cost(a.costs, "model", null).unpriced, 4);
  assert.equal(a.costs.reduce((n, row) => n + row.attempts, 0), 13);
  assert.deepEqual(data.rows.find((row) => row.id === sources.b)!.costs, []);
  assert.ok(cost(data.sharedCosts, "collection", "USD").estimated >= 0.02);
  assert.ok(cost(data.sharedCosts, "model", "CNY").actual >= 0.03);
  for (const total of data.totals.costs) {
    const buckets = [...data.rows.flatMap((row) => row.costs), ...data.sharedCosts].filter((row) => row.stage === total.stage && row.currency === total.currency);
    assert.equal(total.attempts, buckets.reduce((n, row) => n + row.attempts, 0));
    assert.equal(total.unpriced, buckets.reduce((n, row) => n + row.unpriced, 0));
    assert.ok(Math.abs(total.actual - buckets.reduce((n, row) => n + row.actual, 0)) < 1e-9);
    assert.ok(Math.abs(total.estimated - buckets.reduce((n, row) => n + row.estimated, 0)) < 1e-9);
  }
});

test("source cost details require an administrator session", async () => {
  const app = await buildApp();
  const previousPassword = config.adminPassword;
  let session: string | undefined;
  try {
    const response = await app.inject({ method: "GET", url: "/api/admin/sources/efficiency?days=30" });
    assert.equal(response.statusCode, 401);
    assert.equal(response.headers["cache-control"], "no-store");
    config.adminPassword = `efficiency-password-${T}`;
    const login = await passwordLogin(config.adminPassword, "/admin", "source-efficiency-test");
    session = `${SESSION_COOKIE}=${login.token}`;
    const authenticated = await app.inject({ method: "GET", url: "/api/admin/sources/efficiency?days=30", headers: { cookie: session } });
    assert.equal(authenticated.statusCode, 200, authenticated.body);
    assert.equal(authenticated.json().days, 30);
    assert.ok(authenticated.json().rows.some((row: { id: string }) => row.id === sources.a));
  } finally {
    if (session) await endSession(session);
    config.adminPassword = previousPassword;
    await app.close();
  }
});
