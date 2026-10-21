// A provider that refuses stops the pipeline; LLM_FALLBACK_MODEL lets a registered model on another
// service take over. An unknown outcome (timeout) and a provider's content filter stay put: the first
// may already be billed, the second is a decision about the material rather than an outage.
import { Reply, stub, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { z } from "zod";
import { closeDb, sql } from "@aihot/backend/db";
import { chatJson } from "@aihot/backend/providers/llm";

const primary = await stub(() => new Reply(503, { error: "temporarily unavailable" }));
const backup = await stub(() => ({ id: "backup-1", choices: [{ message: { content: '{"ok":true}' } }], usage: { prompt_tokens: 1, completion_tokens: 1 } }));
process.env.DEEPSEEK_BASE_URL = `${primary.url}/v1`;
process.env.DEEPSEEK_API_KEY = "test-key";
process.env.SENSENOVA_BASE_URL = `${backup.url}/v1`;
process.env.SENSENOVA_API_KEY = "test-key";
process.env.LLM_FALLBACK_MODEL = "sensenova-6.8-flash-lite";

after(async () => {
  await primary.close();
  await backup.close();
  delete process.env.LLM_FALLBACK_MODEL;
  await closeDb();
});

const ask = (subject: string) =>
  chatJson({
    model: "deepseek-flash", purpose: "invariant_test", subject, promptVersion: "t1", system: "s", user: "input",
    schema: z.object({ ok: z.boolean() }),
  });

test("a refusing provider hands the call to the fallback model", async () => {
  const subject = `fallback-${tag()}`;
  const res = await ask(subject);
  assert.deepEqual(res.data, { ok: true });
  assert.equal(res.model, "sensenova-6.8-flash-lite");
  assert.equal(res.fallbackFrom, "deepseek-flash");
  const rows = await sql<{ service: string; status: string }[]>`
    SELECT service, status FROM receipts WHERE subject = ${subject} ORDER BY id`;
  assert.deepEqual(rows.map((r) => [r.service, r.status]), [["deepseek", "failed"], ["sensenova", "received"]]);
});

test("a provider's content filter is a decision about the material, not an outage", async () => {
  const filtered = await stub(() => new Reply(400, { error: { code: "contentFilter", message: "contentFilter" } }));
  process.env.DEEPSEEK_BASE_URL = `${filtered.url}/v1`;
  const backupHits = backup.hits();
  await assert.rejects(ask(`filtered-${tag()}`), /contentFilter/);
  assert.equal(backup.hits(), backupHits, "the fallback is not asked to override the filter");
  await filtered.close();
});

test("an unknown fallback name fails before the provider is called", async () => {
  process.env.LLM_FALLBACK_MODEL = "not-a-model";
  const primaryHits = primary.hits();
  await assert.rejects(ask(`unknown-${tag()}`), /LLM_FALLBACK_MODEL names unknown model not-a-model/);
  assert.equal(primary.hits(), primaryHits, "a configuration error spends no attempt");
});
