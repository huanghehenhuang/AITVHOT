import { randomUUID } from "node:crypto";
import { audit, Conflict } from "@aihot/backend/audit";
import { sql } from "@aihot/backend/db";
import type { KnowledgeEdit } from "../types.ts";

const prefix = "knowledge.entry.";
export async function readKnowledgeEdits() {
  const rows = await sql<{ key: string; value: KnowledgeEdit }[]>`SELECT key, value FROM settings WHERE starts_with(key, ${prefix})`;
  return new Map(rows.map(row => [row.key.slice(prefix.length), row.value]));
}

export function saveKnowledgeEdit(id: string, edit: Omit<KnowledgeEdit, "revision">, expected: string, actor: string) {
  const key = prefix + id;
  return sql.begin(async tx => {
    await tx`INSERT INTO settings (key, value) VALUES (${key}, '{}'::jsonb) ON CONFLICT (key) DO NOTHING`;
    const [row] = await tx<{ value: Partial<KnowledgeEdit> }[]>`SELECT value FROM settings WHERE key = ${key} FOR UPDATE`;
    if ((row?.value.revision ?? "") !== expected) throw new Conflict("此条目已被修改，请刷新后再编辑。");
    const next = { ...edit, revision: randomUUID() };
    await tx`UPDATE settings SET value = ${tx.json(next)}, updated_by = ${actor}, updated_at = now() WHERE key = ${key}`;
    await audit(actor, "knowledge.edit", `knowledge:${id}`, null, row?.value, next, { db: tx });
    return next;
  });
}
