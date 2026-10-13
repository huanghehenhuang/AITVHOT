// Provider configuration: a malformed LLM_EXTRA_HEADERS or LLM_EXTRA_JSON is refused before the request
// is sent, so a typo costs neither a receipt nor a budget slot. LLM_EXTRA_HEADERS is read once per
// process (a failed parse is not cached; a repaired value needs no restart), and LLM_EXTRA_JSON is read
// per call by the default model only — preset models carry their own parameters. Which is why the two
// cases live in one file: they share the stub and the budget.
import { stub, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { after, test } from "node:test";
import { z } from "zod";
import { closeDb, sql } from "@aihot/backend/db";
import { chatJson } from "@aihot/backend/providers/llm";

const usage = { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 };
const provider = await stub(() => ({ id: "stub", choices: [{ message: { content: '{"ok":true}' } }], usage }));
process.env.DEEPSEEK_BASE_URL = `${provider.url}/v1`;
process.env.DEEPSEEK_API_KEY = "test-key";
process.env.LLM_BASE_URL = `${provider.url}/v1`;
process.env.LLM_API_KEY = "test-key";
process.env.LLM_MODEL = "deepseek-flash";

const ask = (model: string) =>
  chatJson({ model, purpose: "invariant_test", subject: `config-${tag()}`, promptVersion: "t1", system: "s", user: `input ${tag()}`, schema: z.object({ ok: z.boolean() }) });
const rows = async () =>
  (await sql<{ receipts: number; attempts: number }[]>`SELECT (SELECT count(*)::int FROM receipts) AS receipts, (SELECT count(*)::int FROM receipt_attempts) AS attempts`)[0]!;

after(async () => {
  await provider.close();
  await closeDb();
});

test("a malformed LLM_EXTRA_HEADERS is refused before the request and spends nothing", async () => {
  const before = await rows();
  const hits = provider.hits();
  for (const value of ['{"x-opencode-session":1}', "[1,2]", "null", "42", "{"]) {
    process.env.LLM_EXTRA_HEADERS = value;
    await assert.rejects(ask("deepseek-flash"), /LLM_EXTRA_HEADERS must be a JSON object/);
  }
  assert.equal(provider.hits(), hits, "the provider is never reached");
  assert.deepEqual(await rows(), before, "no receipt is spent on a configuration error");
  process.env.LLM_EXTRA_HEADERS = '{"x-opencode-session":"relay-1"}';
  assert.deepEqual((await ask("deepseek-flash")).data, { ok: true }, "a repaired value takes effect without a restart");
});

test("a malformed LLM_EXTRA_JSON is refused before the request and spends nothing", async () => {
  const before = await rows();
  const hits = provider.hits();
  for (const value of ['"boom"', "[1,2]", "null", "{"]) {
    process.env.LLM_EXTRA_JSON = value;
    await assert.rejects(ask("default"), /LLM_EXTRA_JSON must be a JSON object/);
  }
  assert.equal(provider.hits(), hits, "the provider is never reached");
  assert.deepEqual(await rows(), before, "no receipt is spent on a configuration error");
  delete process.env.LLM_EXTRA_JSON;
  assert.deepEqual((await ask("default")).data, { ok: true });
});
