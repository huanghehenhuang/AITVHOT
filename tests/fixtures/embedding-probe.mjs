// Fixture child for tests/embedding-dimensions.test.ts: with EMBEDDING_DIMS set, either measures the
// recomputed vector's length for one item (EMBED_OP=length) or compares two items' vectors
// (EMBED_OP=compare). The items travel as JSON in EMBED_A / EMBED_B.
import path from "node:path";
import { pathToFileURL } from "node:url";
const { ensureEmbeddings } = await import(pathToFileURL(path.join(process.cwd(), "packages/backend/src/providers/embeddings.ts")).href);
const { cosine32 } = await import(pathToFileURL(path.join(process.cwd(), "packages/backend/src/events/recall.ts")).href);
const { closeDb } = await import(pathToFileURL(path.join(process.cwd(), "packages/backend/src/db.ts")).href);
try {
  if (process.env.EMBED_OP === "length") {
    const item = JSON.parse(process.env.EMBED_A);
    console.log(String((await ensureEmbeddings([item])).get(item.id).length));
  } else {
    const a = JSON.parse(process.env.EMBED_A);
    const b = JSON.parse(process.env.EMBED_B);
    const va = Float32Array.from((await ensureEmbeddings([a])).get(a.id));
    const vb = Float32Array.from((await ensureEmbeddings([b])).get(b.id));
    console.log(JSON.stringify({ old: va.length, fresh: vb.length, score: cosine32(va, vb) }));
  }
} finally {
  await closeDb();
}
