// Fixture child for tests/recall-cache.test.ts: exercises the vector cache and recall paths from a
// fresh process. Items, tag, size and the stale flag arrive via RC_ITEMS / RC_T / RC_SIZE / RC_STALE.
import { vectorsFor, recallFacts, recallSelectedBackground } from "@aihot/backend/events/recall";
import { closeDb, sql } from "@aihot/backend/db";
import { sha256 } from "@aihot/backend/lib/ids";
try {
  const T = process.env.RC_T;
  const items = JSON.parse(process.env.RC_ITEMS);
  const size = Number(process.env.RC_SIZE);
  const stale = process.env.RC_STALE === "true";
  const fillers = Array.from({ length: Math.max(0, size - items.length) }, (_, i) => ({ id: T + "-filler-" + i, text: "filler" }));
  if (size) await vectorsFor([...items.map(it => ({ ...it, revision: 1 })), ...fillers]);
  if (stale) {
    const text = "changed report";
    await sql`UPDATE publications SET title = ${text}, revision = 2 WHERE article_id = ${items[0].id}`;
    await sql`UPDATE embeddings SET text_hash = ${sha256(text + "。")}, vector = ARRAY[0,1]::real[] WHERE ref_id = ${items[0].id}`;
  }
  const facts = await recallFacts(`${T}-query`, "query", 0.5, 10);
  const background = await recallSelectedBackground(`${T}-reading-query`, "query", 0.5);
  if (fillers.length) {
    const filler = fillers[0];
    await sql`UPDATE embeddings SET vector = ARRAY[1,0]::real[] WHERE ref_id = ${filler.id}`;
    const afterEviction = await vectorsFor([filler]);
    if (afterEviction.get(filler.id)[0] !== 1) throw new Error("overflow retained the old cache");
    await sql`UPDATE embeddings SET vector = ARRAY[0,1]::real[] WHERE ref_id = ${filler.id}`;
  }
  console.log(JSON.stringify({ facts, background }));
} finally {
  await closeDb();
}
