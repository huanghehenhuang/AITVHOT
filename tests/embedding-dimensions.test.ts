// Embeddings from any OpenAI-compatible endpoint (EMBEDING_* is not spelled here): a stored vector of
// another size is computed again, a process with another EMBEDDING_DIMS pays for a request of its own,
// and with EMBEDDING_DIMS=0 the provider picks the size and vectors of different sizes never count as
// similar. Cross-process cases run tests/fixtures/embedding-probe.mjs with the operation and operands
// in the environment.
import { stub, tag } from "./setup.ts";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { after, test } from "node:test";
import { promisify } from "node:util";
import { closeDb, sql } from "@aihot/backend/db";
import { sha256 } from "@aihot/backend/lib/ids";

const T = `dims-${tag()}`;
const requests: Array<{ model: string; input: string[]; dimensions?: number }> = [];
// A text carrying this file's tag points along the first axis; the provider's own size is 6.
const provider = await stub((_hit, req) => {
  const body = JSON.parse(req.body) as (typeof requests)[number];
  requests.push(body);
  return { data: body.input.map((text, index) => ({ index, embedding: Array.from({ length: body.dimensions ?? 6 }, (_, i) => Number(i === (text.includes(T) ? 0 : 1))) })) };
});
// The embeddings module reads these when it loads.
process.env.EMBEDDING_DIMS = "4";
process.env.EMBEDDING_MODEL = T;
process.env.EMBEDDING_API_KEY = ["test", "key"].join("-");
process.env.EMBEDDING_BASE_URL = `${provider.url}/v1`;
const { EMBEDDING_MODEL, ensureEmbeddings } = await import("@aihot/backend/providers/embeddings");
after(async () => {
  await provider.close();
  await closeDb();
});

let serial = 0;
const item = () => ({ id: `${T}-${++serial}`, text: `${T} text ${serial}` });
async function stored(it: { id: string; text: string }, vector: number[]) {
  await sql`INSERT INTO embeddings (kind, ref_id, model, text_hash, vector) VALUES ('article', ${it.id}, ${EMBEDDING_MODEL}, ${sha256(it.text)}, ${vector})`;
}
const persisted = async (id: string) =>
  (await sql<{ vector: number[] }[]>`SELECT vector FROM embeddings WHERE kind = 'article' AND ref_id = ${id} AND model = ${EMBEDDING_MODEL}`)[0]?.vector;
async function freshProcess(dimensions: number, env: NodeJS.ProcessEnv) {
  const { stdout } = await promisify(execFile)("node", ["--", "tests/fixtures/embedding-probe.mjs"],
    { env: { ...process.env, EMBEDDING_DIMS: String(dimensions), ...env } });
  return JSON.parse(stdout);
}

for (const oldLength of [2, 8]) test(`a stored vector of ${oldLength} dimensions is computed again at the configured 4`, async () => {
  const it = item();
  await stored(it, Array.from({ length: oldLength }, (_, i) => Number(i === 0)));
  const before = requests.length;
  assert.deepEqual((await ensureEmbeddings([it])).get(it.id), [1, 0, 0, 0], "a stale vector is replaced, never reused or cropped");
  assert.equal(requests.length, before + 1);
  assert.equal(requests.at(-1)!.dimensions, 4);
  assert.deepEqual(await persisted(it.id), [1, 0, 0, 0]);
});

test("a restarted process with other dimensions pays for a request of its own", async () => {
  const it = item();
  const before = requests.length;
  assert.equal((await ensureEmbeddings([it])).get(it.id)!.length, 4);
  const length = await freshProcess(2, { EMBED_OP: "length", EMBED_A: JSON.stringify(it) });
  assert.equal(length, 2);
  assert.deepEqual(requests.slice(before).map((r) => r.dimensions), [4, 2]);
  assert.equal((await persisted(it.id))!.length, 2);
  const receipts = await sql`SELECT DISTINCT logical_key FROM receipts WHERE model = ${EMBEDDING_MODEL} AND subject = ${`article:${it.id}`}`;
  assert.equal(receipts.length, 2);
});

test("the provider's own size keeps stored vectors, asks for no dimensions and never compares sizes", async () => {
  const old = item();
  const fresh = item();
  await stored(old, [1, 0]);
  const before = requests.length;
  const got = await freshProcess(0, { EMBED_OP: "compare", EMBED_A: JSON.stringify(old), EMBED_B: JSON.stringify(fresh) });
  assert.deepEqual(got, { old: 2, fresh: 6, score: 0 }, "the first two coordinates agree, but different sizes are not similar");
  assert.equal(requests.length, before + 1);
  assert.equal(Object.hasOwn(requests.at(-1)!, "dimensions"), false);
});
