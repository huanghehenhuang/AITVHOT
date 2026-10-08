import { stub, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { config } from "@aihot/backend/config";
import { closeDb, sql } from "@aihot/backend/db";
import { searchTweets } from "@aihot/backend/providers/socialdata";

const provider = await stub((_hit, request) => ({ tweets: new URL(request.url, "http://stub").searchParams.get("query") === "empty" ? [] : [{ id_str: "1" }, { id_str: "2" }] }));
process.env.SOCIALDATA_BASE_URL = provider.url;
process.env.SOCIALDATA_API_KEY = "test-key";
const previousPrivateFetch = config.allowPrivateNetworkFetch;
config.allowPrivateNetworkFetch = true;
const [budget] = await sql`SELECT per_minute, per_hour, per_day FROM budgets WHERE service = 'socialdata'`;
await sql`UPDATE budgets SET per_minute = 1000, per_hour = 10000, per_day = 100000 WHERE service = 'socialdata'`;
after(async () => {
  if (budget) await sql`UPDATE budgets SET per_minute = ${budget.per_minute}, per_hour = ${budget.per_hour}, per_day = ${budget.per_day} WHERE service = 'socialdata'`;
  config.allowPrivateNetworkFetch = previousPrivateFetch;
  await provider.close();
  await closeDb();
});

test("an empty successful search keeps unknown billing, and recovery does not send it again", async () => {
  const options = { purpose: "source_fetch", subject: `empty-${tag()}`, window: tag() };
  const first = await searchTweets("empty", options);
  const recovered = await searchTweets("empty", options);
  assert.equal(first.reused, false);
  assert.equal(recovered.reused, true);
  assert.equal(recovered.receiptId, first.receiptId);
  assert.equal(provider.hits(), 1);
  const attempts = await sql`SELECT cost, cost_basis, usage FROM receipt_attempts WHERE receipt_id = ${first.receiptId}`;
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0]!.cost, null, "an account-wide empty-request fee cannot be inferred from this response");
  assert.equal(attempts[0]!.cost_basis, null);
  assert.equal(attempts[0]!.usage.tweets, 0);
});

test("a nonempty search estimates returned tweets, not the number of requests", async () => {
  const result = await searchTweets("posts", { purpose: "source_fetch", subject: `posts-${tag()}`, window: tag() });
  const [attempt] = await sql`SELECT cost, currency, cost_basis FROM receipt_attempts WHERE receipt_id = ${result.receiptId}`;
  assert.equal(attempt!.cost, 0.0004);
  assert.equal(attempt!.currency, "USD");
  assert.equal(attempt!.cost_basis, "estimated");
});
