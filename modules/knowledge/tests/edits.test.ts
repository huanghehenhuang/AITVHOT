import assert from "node:assert/strict";
import { test } from "node:test";
import { sql } from "@aihot/backend/db";
import { readKnowledgeEdits, saveKnowledgeEdit } from "../backend/edits.ts";
import { loadKnowledge } from "../backend/publication.ts";

test("an administrator's introduction and tags appear together and stale edits are rejected", async () => {
  try {
    const initial = await loadKnowledge(new URLSearchParams({ kind: "workflow" }));
    const entry = initial.entries[0]!;
    const summary = "用参考图生成一段视频。";
    const saved = await saveKnowledgeEdit(entry.id, { summary, tags: ["参考图视频"] }, "", "test-admin");
    await assert.rejects(saveKnowledgeEdit(entry.id, { tags: [] }, "", "other-admin"), { code: "conflict" });
    const result = await loadKnowledge(new URLSearchParams({ tag: "参考图视频", kind: "workflow" }), await readKnowledgeEdits());
    assert.equal(result.matchedTotal, 1);
    assert.equal(result.entries[0]?.summary, summary);
    assert.deepEqual(result.entries[0]?.tags, ["参考图视频"]);
    assert.equal((await readKnowledgeEdits()).get(entry.id)?.revision, saved.revision);
    const audit = await sql`SELECT actor FROM audit_log WHERE action = 'knowledge.edit' AND subject = ${`knowledge:${entry.id}`}`;
    assert.deepEqual([...audit], [{ actor: "test-admin" }]);
  } finally { await sql.end(); }
});
